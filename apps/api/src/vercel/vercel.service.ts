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
    /**
     * Last-resort routing targets, used only when the Vercel config API can't be
     * reached (or in mock dev). Vercel's per-project recommendation (a dedicated
     * `<hash>.vercel-dns-NNN.com` CNAME / apex A records) is fetched live and
     * preferred — see `recommendedRouting`. Env overrides for self-hosting.
     */
    private readonly cnameTarget =
        process.env.VERCEL_CNAME_TARGET ?? "cname.vercel-dns.com";
    private readonly apexTarget = process.env.VERCEL_A_RECORD ?? "76.76.21.21";

    /** Whether real Vercel API calls are configured. */
    get isLive(): boolean {
        return Boolean(this.apiToken && this.projectId);
    }

    /** Apex = one label + TLD (CNAME isn't valid at the apex → use A records). */
    private isApex(domain: string): boolean {
        // Multi-part public suffixes (example.co.uk) aren't special-cased — fine
        // for current tenants, who use standard single-part TLDs.
        return domain.split(".").length === 2;
    }

    /**
     * Fallback routing record when Vercel's recommendation is unavailable: apex →
     * A (env `VERCEL_A_RECORD`), subdomain → CNAME (env `VERCEL_CNAME_TARGET`).
     */
    private defaultRouting(domain: string): DnsRecord {
        return this.isApex(domain)
            ? { type: "A", name: domain, value: this.apexTarget }
            : { type: "CNAME", name: domain, value: this.cnameTarget };
    }

    /**
     * The routing record(s) Vercel recommends for THIS project, read from the
     * domain config API (`recommendedCNAME` / `recommendedIPv4`, rank 1 = top
     * pick). The CNAME is a dedicated, per-project target — never hardcoded.
     * Apex domains may need multiple A records. Falls back to env defaults if the
     * recommendation is missing.
     */
    private recommendedRouting(
        domain: string,
        config: VercelDomainConfig
    ): DnsRecord[] {
        if (this.isApex(domain)) {
            const ips = topRanked(config.recommendedIPv4)?.value;
            const values = ips?.length ? ips : [this.apexTarget];
            return values.map((value) => ({ type: "A", name: domain, value }));
        }
        const cname = topRanked(config.recommendedCNAME)?.value;
        return [
            {
                type: "CNAME",
                name: domain,
                value: stripTrailingDot(cname) ?? this.cnameTarget,
            },
        ];
    }

    /**
     * Routing record(s) + any unique TXT ownership challenge Vercel currently
     * requires (the `verification` array — present only while ownership is
     * unsettled, e.g. the domain is also attached elsewhere on Vercel, and gone
     * again once verified).
     */
    private buildDnsInstructions(
        routing: DnsRecord[],
        verification?: VercelProjectDomain["verification"]
    ): DnsRecord[] {
        const records: DnsRecord[] = [...routing];
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
                dnsInstructions: this.buildDnsInstructions([
                    this.defaultRouting(domain),
                ]),
            };
        }

        const res = await this.vercel<VercelProjectDomain>(
            `/v10/projects/${this.projectId}/domains`,
            "POST",
            { name: domain }
        );

        const { status, routing } = await this.resolveDomainState(
            domain,
            Boolean(res.verified)
        );

        return {
            id: domain,
            hostname: domain,
            status,
            dnsInstructions: this.buildDnsInstructions(
                routing,
                res.verification
            ),
        };
    }

    /**
     * Single source for a domain's current state, derived from one config fetch:
     *  - `routing`: the record(s) Vercel recommends for this project right now.
     *  - `status`:  not verified OR DNS not pointing at Vercel → "pending";
     *               verified + DNS correct + HTTPS not serving → "provisioning"
     *               (cert issuing); verified + DNS correct + HTTPS serving →
     *               "active". `verified` alone only settles ownership, so the
     *               config (`misconfigured`) gates it and an HTTPS probe
     *               distinguishes "cert issuing" from "live".
     */
    private async resolveDomainState(
        domain: string,
        verified: boolean
    ): Promise<{ status: DomainStatus; routing: DnsRecord[] }> {
        const config = await this.getDomainConfig(domain);
        const routing = this.recommendedRouting(domain, config);
        let status: DomainStatus;
        if (!verified || config.misconfigured) {
            status = "pending";
        } else {
            status = (await this.isHttpsReady(domain))
                ? "active"
                : "provisioning";
        }
        return { status, routing };
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

        return (await this.resolveDomainState(domain, verified)).status;
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
                dnsInstructions: this.buildDnsInstructions([
                    this.defaultRouting(domain),
                ]),
            };
        }

        let info: VercelProjectDomain;
        try {
            info = await this.vercel<VercelProjectDomain>(
                `/v9/projects/${this.projectId}/domains/${domain}`,
                "GET"
            );
        } catch {
            // Not attached yet / transient — still show a routing record so the
            // agent can set up DNS; nothing is verified.
            return {
                id: domain,
                hostname: domain,
                status: "pending",
                dnsInstructions: [this.defaultRouting(domain)],
            };
        }

        const { status, routing } = await this.resolveDomainState(
            domain,
            Boolean(info.verified)
        );

        return {
            id: domain,
            hostname: domain,
            status,
            dnsInstructions: this.buildDnsInstructions(
                routing,
                info.verification
            ),
        };
    }

    /**
     * The domain's live config from Vercel: `misconfigured` (DNS not yet pointing
     * at Vercel) plus the per-project recommended routing records. Errors are
     * treated as not-ready (misconfigured) with no recommendation.
     */
    private async getDomainConfig(domain: string): Promise<VercelDomainConfig> {
        try {
            return await this.vercel<VercelDomainConfig>(
                `/v6/domains/${domain}/config`,
                "GET"
            );
        } catch {
            return { misconfigured: true };
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

/** Subset of `GET /v6/domains/{domain}/config` we rely on. */
type VercelDomainConfig = {
    misconfigured?: boolean;
    /** Ranked CNAME targets; rank 1 is the dedicated per-project target. */
    recommendedCNAME?: { rank: number; value: string }[];
    /** Ranked A-record sets for apex domains; rank 1 is the top pick. */
    recommendedIPv4?: { rank: number; value: string[] }[];
};

/** Lowest `rank` wins (rank 1 = Vercel's top recommendation). */
function topRanked<T extends { rank: number }>(items?: T[]): T | undefined {
    if (!items?.length) return undefined;
    return items.reduce((best, cur) => (cur.rank < best.rank ? cur : best));
}

/** DNS values from Vercel come FQDN-style with a trailing dot; registrars don't want it. */
function stripTrailingDot(value: string | undefined): string | undefined {
    return value?.replace(/\.$/, "");
}
