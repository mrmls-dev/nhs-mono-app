import { BadGatewayException, Injectable, Logger } from "@nestjs/common";

/** A minted public token: the `pk.*` value and its Mapbox id. */
export type MapboxToken = { id: string; token: string };

/**
 * Scopes a public map token needs to render a Mapbox GL JS vector style.
 * `styles:read` + `fonts:read` cover normal GL JS loading; `styles:tiles` is
 * only required for raster/static tile use, so it is intentionally omitted.
 * (The `sk.*` token used to mint these must itself carry every scope granted.)
 */
const PUBLIC_MAP_SCOPES = ["styles:read", "fonts:read"];

/**
 * Mints, updates, and deletes per-tenant **public** Mapbox tokens via the
 * Tokens API (`/tokens/v2/{username}`), each URL-restricted to a tenant's
 * custom domain. Mapbox auto-allows subdomains of an allowed URL, so a single
 * `https://customer.com` entry also covers `www.customer.com` — no wildcards
 * (Mapbox rejects them) and no per-subdomain tokens needed.
 *
 * Runs in **mock mode** whenever `MAPBOX_TOKENS_SECRET`/`MAPBOX_USERNAME` are
 * unset (local dev): no network calls, deterministic stub returned, so the
 * domain flow is fully exercisable without credentials.
 */
@Injectable()
export class MapboxTokensService {
    private readonly logger = new Logger(MapboxTokensService.name);
    /** Secret (sk.*) token with `tokens:write` + the granted map scopes. */
    private readonly secret = process.env.MAPBOX_TOKENS_SECRET;
    private readonly username = process.env.MAPBOX_USERNAME;

    /** Whether real Mapbox Tokens API calls are configured. */
    get isLive(): boolean {
        return Boolean(this.secret && this.username);
    }

    /**
     * Allowed-URL list for a domain. Just the bare `https://<domain>` — Mapbox
     * authorizes subpaths and subdomains of it automatically (so `www.` and any
     * tenant sub-subdomain are covered). Wildcards are unsupported and rejected.
     */
    private allowedUrls(domain: string): string[] {
        return [`https://${domain}`];
    }

    /** Create a public token restricted to `domain`. */
    async createToken(domain: string): Promise<MapboxToken> {
        if (!this.isLive) {
            this.logger.warn(
                `[mock] Mapbox not configured — pretending to mint token for "${domain}"`
            );
            return { id: `mock-${domain}`, token: "pk.mock-token" };
        }
        const res = await this.tokens<MapboxTokenResponse>(
            `/tokens/v2/${this.username}`,
            "POST",
            {
                note: `nhs map — ${domain}`,
                scopes: PUBLIC_MAP_SCOPES,
                allowedUrls: this.allowedUrls(domain),
            }
        );
        return this.toToken(res);
    }

    /**
     * Repoint an existing token at a new domain (tenant changed their custom
     * domain). The `pk.*` value is unchanged; only its allowed URLs move.
     */
    async updateTokenUrls(
        tokenId: string,
        domain: string
    ): Promise<MapboxToken> {
        if (!this.isLive) {
            this.logger.warn(
                `[mock] Mapbox not configured — pretending to update token "${tokenId}" → "${domain}"`
            );
            return { id: tokenId, token: "pk.mock-token" };
        }
        const res = await this.tokens<MapboxTokenResponse>(
            `/tokens/v2/${this.username}/${tokenId}`,
            "PATCH",
            { allowedUrls: this.allowedUrls(domain) }
        );
        return this.toToken(res);
    }

    /** Delete a token (no-op if already gone). */
    async deleteToken(tokenId: string): Promise<void> {
        if (!this.isLive) {
            this.logger.warn(
                `[mock] Mapbox not configured — pretending to delete token "${tokenId}"`
            );
            return;
        }
        await this.tokens(
            `/tokens/v2/${this.username}/${tokenId}`,
            "DELETE",
            undefined,
            // 404 = already removed; treat as success.
            [404]
        );
    }

    private toToken(res: MapboxTokenResponse): MapboxToken {
        if (!res.id || !res.token) {
            throw new BadGatewayException(
                "Mapbox token response missing id/token"
            );
        }
        return { id: res.id, token: res.token };
    }

    private async tokens<T = unknown>(
        path: string,
        method: "POST" | "PATCH" | "DELETE",
        body?: unknown,
        okStatuses: number[] = []
    ): Promise<T> {
        const url = new URL(`https://api.mapbox.com${path}`);
        url.searchParams.set("access_token", this.secret!);
        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: body ? JSON.stringify(body) : undefined,
        });
        if (!res.ok && !okStatuses.includes(res.status)) {
            const detail = await res.text().catch(() => "");
            this.logger.error(
                `Mapbox Tokens API ${method} ${path} failed (${res.status}): ${detail}`
            );
            throw new BadGatewayException("Mapbox Tokens API request failed");
        }
        return (await res.json().catch(() => ({}))) as T;
    }
}

/** Subset of the `/tokens/v2` create/update response we rely on. */
type MapboxTokenResponse = { id?: string; token?: string };
