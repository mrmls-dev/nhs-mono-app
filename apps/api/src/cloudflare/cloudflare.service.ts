import { Injectable, Logger, BadGatewayException } from "@nestjs/common";

export type CustomHostnameResult = {
    /** Cloudflare custom-hostname id (null in mock mode). */
    id: string | null;
    hostname: string;
    /** "pending" until SSL + DNS are validated, then "active". */
    status: "pending" | "active";
    /** DNS records the agent must add at their registrar. */
    dnsInstructions: { type: string; name: string; value: string }[];
};

/**
 * Cloudflare for SaaS — manages agent custom domains via the Custom Hostnames
 * API (custom hostname → SSL → Vercel origin).
 *
 * Runs in **mock mode** whenever `CLOUDFLARE_API_TOKEN`/`CLOUDFLARE_ZONE_ID`
 * are unset (i.e. local dev): no network calls are made and a deterministic
 * `pending` result is returned so the domain UI is fully exercisable without
 * credentials. Set the CLOUDFLARE_* env vars to hit the real API.
 */
@Injectable()
export class CloudflareService {
    private readonly logger = new Logger(CloudflareService.name);
    private readonly apiToken = process.env.CLOUDFLARE_API_TOKEN;
    private readonly zoneId = process.env.CLOUDFLARE_ZONE_ID;
    /**
     * The proxied hostname in our zone that agents CNAME their custom domain
     * at. This is the Cloudflare-for-SaaS *CNAME target* — distinct from the
     * SaaS fallback origin (which is configured in the CF dashboard, not via
     * the API). Routing it through a dedicated record lets us repoint the
     * fallback origin later without every agent having to update DNS.
     */
    private readonly cnameTarget =
        process.env.CF_SAAS_CNAME_TARGET ?? "agents.nationalhousesearch.com";

    /** Whether real Cloudflare API calls are configured. */
    get isLive(): boolean {
        return Boolean(this.apiToken && this.zoneId);
    }

    private dnsInstructions(hostname: string) {
        // The agent points their apex/subdomain at our proxied CNAME target,
        // which routes through Cloudflare for SaaS to the Vercel origin.
        return [{ type: "CNAME", name: hostname, value: this.cnameTarget }];
    }

    async addHostname(hostname: string): Promise<CustomHostnameResult> {
        if (!this.isLive) {
            this.logger.warn(
                `[mock] Cloudflare not configured — pretending to add custom hostname "${hostname}"`
            );
            return {
                id: null,
                hostname,
                status: "pending",
                dnsInstructions: this.dnsInstructions(hostname),
            };
        }

        const res = await this.cf(
            `/zones/${this.zoneId}/custom_hostnames`,
            "POST",
            {
                hostname,
                ssl: { method: "http", type: "dv" },
            }
        );

        const result = asObject(res.result);
        return {
            id: result?.id ?? null,
            hostname,
            status: isActive(result) ? "active" : "pending",
            dnsInstructions: this.dnsInstructions(hostname),
        };
    }

    async getHostnameStatus(hostname: string): Promise<"pending" | "active"> {
        if (!this.isLive) {
            this.logger.warn(
                `[mock] Cloudflare not configured — reporting "active" for "${hostname}"`
            );
            return "active";
        }
        // We don't persist the CF id, so resolve it by hostname on demand.
        const id = await this.findHostnameId(hostname);
        if (!id) return "pending";
        const res = await this.cf(
            `/zones/${this.zoneId}/custom_hostnames/${id}`,
            "GET"
        );
        return isActive(asObject(res.result)) ? "active" : "pending";
    }

    async removeHostname(hostname: string): Promise<void> {
        if (!this.isLive) {
            this.logger.warn(
                `[mock] Cloudflare not configured — pretending to remove "${hostname}"`
            );
            return;
        }
        const id = await this.findHostnameId(hostname);
        if (!id) return; // already gone
        await this.cf(`/zones/${this.zoneId}/custom_hostnames/${id}`, "DELETE");
    }

    /** Look up a custom hostname's CF id by its name (live mode only). */
    private async findHostnameId(hostname: string): Promise<string | null> {
        const res = await this.cf(
            `/zones/${this.zoneId}/custom_hostnames?hostname=${encodeURIComponent(hostname)}`,
            "GET"
        );
        const list = Array.isArray(res.result) ? res.result : [];
        return list[0]?.id ?? null;
    }

    private async cf(
        path: string,
        method: "GET" | "POST" | "DELETE",
        body?: unknown
    ): Promise<{ result?: CfHostname | CfHostname[] }> {
        const res = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
            method,
            headers: {
                Authorization: `Bearer ${this.apiToken}`,
                "Content-Type": "application/json",
            },
            body: body ? JSON.stringify(body) : undefined,
        });
        const json = (await res.json()) as {
            success: boolean;
            errors?: unknown;
            result?: CfHostname | CfHostname[];
        };
        if (!res.ok || !json.success) {
            this.logger.error(
                `Cloudflare API ${method} ${path} failed: ${JSON.stringify(json.errors)}`
            );
            throw new BadGatewayException("Cloudflare API request failed");
        }
        return json;
    }
}

/** Shape of a Cloudflare custom_hostname object (only the fields we read). */
type CfHostname = {
    id?: string;
    /** Hostname verification: "pending" | "active" | "blocked" | … */
    status?: string;
    /** Certificate state: "pending_validation" | "pending_issuance" | "active" | … */
    ssl?: { status?: string };
};

/** Narrow a CF `result` (object or array) to its single-object form. */
function asObject(
    result: CfHostname | CfHostname[] | undefined
): CfHostname | undefined {
    return Array.isArray(result) ? result[0] : result;
}

/**
 * A custom hostname is only truly serving once both the hostname is verified
 * AND its certificate has been issued — until then HTTPS requests fail.
 */
function isActive(result: CfHostname | undefined): boolean {
    return result?.status === "active" && result.ssl?.status === "active";
}
