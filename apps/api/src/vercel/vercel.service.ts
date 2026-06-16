import { Injectable, Logger, BadGatewayException } from "@nestjs/common";

export type DnsRecord = { type: string; name: string; value: string };

/**
 * Lifecycle of a custom domain:
 *  - `pending`      — ownership not yet verified, or routing DNS not pointing at
 *                     Vercel (the agent still has records to add).
 *  - `provisioning` — verified + DNS correct; Vercel is issuing the Let's Encrypt
 *                     certificate (typically a few minutes) — not yet serving HTTPS.
 *  - `active`       — certificate issued and the domain is serving HTTPS.
 */
export type DomainStatus = "pending" | "provisioning" | "active";

export type DomainSetupResult = {
    /** Echoes the domain (kept for API-shape parity with the web client). */
    id: string | null;
    hostname: string;
    status: DomainStatus;
    /** DNS records the agent must add at their registrar. */
    dnsInstructions: DnsRecord[];
};

/** How long to wait for the HTTPS handshake when probing cert readiness. */
const SSL_PROBE_TIMEOUT_MS = 4000;

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
    /** What agents CNAME their *subdomain* at; Vercel serves the cert for it. */
    private readonly cnameTarget =
        process.env.VERCEL_CNAME_TARGET ?? "cname.vercel-dns.com";
    /** A record an *apex* domain points at (Vercel's anycast IP). */
    private readonly apexTarget = process.env.VERCEL_A_RECORD ?? "76.76.21.21";

    /** Whether real Vercel API calls are configured. */
    get isLive(): boolean {
        return Boolean(this.apiToken && this.projectId);
    }

    /**
     * The routing record the agent must add so traffic reaches Vercel: an apex
     * domain (one label + TLD) needs an A record; a subdomain needs a CNAME.
     * Multi-part public suffixes (example.co.uk) aren't special-cased — fine for
     * current tenants, who use standard single-part TLDs.
     */
    private routingInstruction(domain: string): DnsRecord {
        return domain.split(".").length === 2
            ? { type: "A", name: domain, value: this.apexTarget }
            : { type: "CNAME", name: domain, value: this.cnameTarget };
    }

    /**
     * Routing record + any unique TXT ownership challenge Vercel currently
     * requires (the `verification` array — present only while ownership is
     * unsettled, e.g. the domain is also attached elsewhere on Vercel, and gone
     * again once verified).
     */
    private buildDnsInstructions(
        domain: string,
        verification?: VercelProjectDomain["verification"]
    ): DnsRecord[] {
        const records: DnsRecord[] = [this.routingInstruction(domain)];
        for (const v of verification ?? []) {
            if (v.type && v.domain && v.value) {
                records.push({ type: v.type, name: v.domain, value: v.value });
            }
        }
        return records;
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
                dnsInstructions: this.buildDnsInstructions(domain),
            };
        }

        const res = await this.vercel<VercelProjectDomain>(
            `/v10/projects/${this.projectId}/domains`,
            "POST",
            { name: domain }
        );

        const dnsInstructions = this.buildDnsInstructions(
            domain,
            res.verification
        );

        return {
            id: domain,
            hostname: domain,
            status: await this.resolveStatus(domain, Boolean(res.verified)),
            dnsInstructions,
        };
    }

    /**
     * Map Vercel's signals to a lifecycle status:
     *   not verified OR DNS not pointing at Vercel  → "pending"
     *   verified + DNS correct + HTTPS not serving  → "provisioning" (cert issuing)
     *   verified + DNS correct + HTTPS serving       → "active"
     * `verified` alone only means ownership is settled — it does NOT mean the
     * routing record is in place, so the config (`misconfigured`) check gates it,
     * and an HTTPS probe distinguishes "cert issuing" from "live".
     */
    private async resolveStatus(
        domain: string,
        verified: boolean
    ): Promise<DomainStatus> {
        if (!verified || (await this.isMisconfigured(domain))) return "pending";
        return (await this.isHttpsReady(domain)) ? "active" : "provisioning";
    }

    /**
     * Whether the domain is already serving HTTPS with a valid certificate. A
     * successful TLS handshake (any HTTP response, redirects not followed) means
     * Vercel has issued the cert; a handshake failure means it's still being
     * provisioned. HEAD only, short timeout, body never read.
     */
    private async isHttpsReady(domain: string): Promise<boolean> {
        try {
            await fetch(`https://${domain}/`, {
                method: "HEAD",
                redirect: "manual",
                signal: AbortSignal.timeout(SSL_PROBE_TIMEOUT_MS),
            });
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Re-check a domain: nudge verification, confirm DNS points at Vercel, then
     * probe HTTPS. Returns "pending" → "provisioning" (cert issuing) → "active".
     */
    async getDomainStatus(domain: string): Promise<DomainStatus> {
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

        return this.resolveStatus(domain, verified);
    }

    /**
     * Read-only snapshot of what a domain needs *right now*, with Vercel as the
     * source of truth. Returns the live routing record plus any TXT ownership
     * challenge Vercel currently requires, and the current status. Unlike
     * `getDomainStatus` this does not POST a verification attempt — it just
     * reports state, so it's safe to call every time the domain panel opens.
     */
    async getDomainSetup(domain: string): Promise<DomainSetupResult> {
        if (!this.isLive) {
            this.logger.warn(
                `[mock] Vercel not configured — returning static setup for "${domain}"`
            );
            return {
                id: domain,
                hostname: domain,
                status: "pending",
                dnsInstructions: this.buildDnsInstructions(domain),
            };
        }

        let info: VercelProjectDomain;
        try {
            info = await this.vercel<VercelProjectDomain>(
                `/v9/projects/${this.projectId}/domains/${domain}`,
                "GET"
            );
        } catch {
            // Not attached yet / transient — still show the routing record so
            // the agent can set up DNS; nothing is verified.
            return {
                id: domain,
                hostname: domain,
                status: "pending",
                dnsInstructions: [this.routingInstruction(domain)],
            };
        }

        return {
            id: domain,
            hostname: domain,
            status: await this.resolveStatus(domain, Boolean(info.verified)),
            dnsInstructions: this.buildDnsInstructions(
                domain,
                info.verification
            ),
        };
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
