import { Injectable, Logger, BadGatewayException } from "@nestjs/common";

export type DnsRecord = { type: string; name: string; value: string };

export type DomainSetupResult = {
    /** Echoes the domain (kept for API-shape parity with the web client). */
    id: string | null;
    hostname: string;
    /** "pending" until DNS resolves + SSL is issued, then "active". */
    status: "pending" | "active";
    /** DNS records the agent must add at their registrar. */
    dnsInstructions: DnsRecord[];
};

/**
 * Vercel-native custom domains. Agents (and their free `{slug}` subdomains)
 * are attached to the Vercel project via the Domains API; Vercel issues and
 * auto-renews the Let's Encrypt certificate and routes by Host. There is no
 * second CDN in the path, so the Cloudflare-for-SaaS origin SSL handshake
 * (error 525) cannot occur.
 *
 * Runs in **mock mode** whenever `VERCEL_API_TOKEN`/`VERCEL_PROJECT_ID` are
 * unset (i.e. local dev): no network calls are made and a deterministic
 * `pending` result is returned so the domain UI is fully exercisable without
 * credentials.
 */
@Injectable()
export class VercelDomainsService {
    private readonly logger = new Logger(VercelDomainsService.name);
    private readonly apiToken = process.env.VERCEL_API_TOKEN;
    private readonly projectId = process.env.VERCEL_PROJECT_ID;
    private readonly teamId = process.env.VERCEL_TEAM_ID;
    /** What agents CNAME their domain at; Vercel serves the cert for it. */
    private readonly cnameTarget =
        process.env.VERCEL_CNAME_TARGET ?? "cname.vercel-dns.com";

    /** Whether real Vercel API calls are configured. */
    get isLive(): boolean {
        return Boolean(this.apiToken && this.projectId);
    }

    private cnameInstruction(domain: string): DnsRecord {
        return { type: "CNAME", name: domain, value: this.cnameTarget };
    }

    /**
     * Attach a domain (agent subdomain or external custom domain) to the Vercel
     * project. Returns the DNS records the agent must add: the CNAME plus any
     * one-time TXT challenge Vercel requires (only when the domain is already in
     * use on another Vercel account/project).
     */
    async addDomain(domain: string): Promise<DomainSetupResult> {
        if (!this.isLive) {
            this.logger.warn(
                `[mock] Vercel not configured — pretending to add domain "${domain}"`
            );
            return {
                id: domain,
                hostname: domain,
                status: "pending",
                dnsInstructions: [this.cnameInstruction(domain)],
            };
        }

        const res = await this.vercel<VercelProjectDomain>(
            `/v10/projects/${this.projectId}/domains`,
            "POST",
            { name: domain }
        );

        const dnsInstructions: DnsRecord[] = [this.cnameInstruction(domain)];
        for (const v of res.verification ?? []) {
            if (v.type && v.domain && v.value) {
                dnsInstructions.push({
                    type: v.type,
                    name: v.domain,
                    value: v.value,
                });
            }
        }

        // `verified` only means ownership is settled (no TXT challenge needed);
        // it does NOT mean DNS points at Vercel. A just-added domain whose CNAME
        // isn't in place yet must read "pending", so confirm via the config
        // endpoint — `misconfigured: false` is the real "live + cert issued" gate.
        const active =
            Boolean(res.verified) && !(await this.isMisconfigured(domain));

        return {
            id: domain,
            hostname: domain,
            status: active ? "active" : "pending",
            dnsInstructions,
        };
    }

    /**
     * Re-check a domain: nudge verification, then confirm DNS points at Vercel.
     * "active" means verified AND not misconfigured (cert issued + serving).
     */
    async getDomainStatus(domain: string): Promise<"pending" | "active"> {
        if (!this.isLive) {
            this.logger.warn(
                `[mock] Vercel not configured — reporting "active" for "${domain}"`
            );
            return "active";
        }

        let verified: boolean;
        try {
            const info = await this.vercel<VercelProjectDomain>(
                `/v9/projects/${this.projectId}/domains/${domain}`,
                "GET"
            );
            verified = Boolean(info.verified);
        } catch {
            return "pending"; // not attached yet / transient
        }

        // Still unverified → attempt verification now (the TXT may have landed).
        if (!verified) {
            try {
                const v = await this.vercel<VercelProjectDomain>(
                    `/v9/projects/${this.projectId}/domains/${domain}/verify`,
                    "POST"
                );
                verified = Boolean(v.verified);
            } catch {
                // leave unverified
            }
        }
        if (!verified) return "pending";

        // Verified — confirm the CNAME/A actually resolves to Vercel (cert needs it).
        return (await this.isMisconfigured(domain)) ? "pending" : "active";
    }

    /**
     * Whether Vercel sees the domain's DNS as not yet pointing at it. `true`
     * means the agent hasn't added the CNAME (or it hasn't propagated), so the
     * domain isn't serving and no certificate has been issued. Unknown/errors
     * are treated as not-ready.
     */
    private async isMisconfigured(domain: string): Promise<boolean> {
        try {
            const config = await this.vercel<{ misconfigured?: boolean }>(
                `/v6/domains/${domain}/config`,
                "GET"
            );
            return Boolean(config.misconfigured);
        } catch {
            return true;
        }
    }

    /** Detach a domain from the project (no-op if already gone). */
    async removeDomain(domain: string): Promise<void> {
        if (!this.isLive) {
            this.logger.warn(
                `[mock] Vercel not configured — pretending to remove "${domain}"`
            );
            return;
        }
        try {
            await this.vercel(
                `/v9/projects/${this.projectId}/domains/${domain}`,
                "DELETE"
            );
        } catch (err) {
            // Already removed is fine; surface anything else.
            if (!(err instanceof DomainNotFoundError)) throw err;
        }
    }

    private async vercel<T>(
        path: string,
        method: "GET" | "POST" | "DELETE",
        body?: unknown
    ): Promise<T> {
        const url = new URL(`https://api.vercel.com${path}`);
        if (this.teamId) url.searchParams.set("teamId", this.teamId);
        const res = await fetch(url, {
            method,
            headers: {
                Authorization: `Bearer ${this.apiToken}`,
                "Content-Type": "application/json",
            },
            body: body ? JSON.stringify(body) : undefined,
        });
        const json = (await res.json().catch(() => ({}))) as T & {
            error?: { code?: string; message?: string };
        };
        if (!res.ok) {
            if (res.status === 404) throw new DomainNotFoundError();
            this.logger.error(
                `Vercel API ${method} ${path} failed: ${JSON.stringify(json.error)}`
            );
            throw new BadGatewayException(
                json.error?.message ?? "Vercel API request failed"
            );
        }
        return json;
    }
}

/** Internal: lets `removeDomain` treat a missing domain as success. */
class DomainNotFoundError extends Error {}

type VercelProjectDomain = {
    name?: string;
    verified?: boolean;
    verification?: { type?: string; domain?: string; value?: string }[];
};
