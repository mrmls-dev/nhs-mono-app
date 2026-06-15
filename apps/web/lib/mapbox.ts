/**
 * Mapbox GL fires every style / tile / sprite / glyph request straight at
 * `*.mapbox.com` with a public access token in the query string. Our public
 * token is URL-restricted in the Mapbox dashboard, so on a freshly-added tenant
 * domain (custom domain or `{slug}` subdomain) those requests 403 and the map
 * never paints.
 *
 * Rather than maintain that allowlist per tenant (capped at ~100 URLs), we
 * rewrite each Mapbox request to our own same-origin proxy
 * (`/api/mapbox/<host>/<path>`), which injects an unrestricted server-side
 * token. This works on any tenant domain with zero Mapbox-side config.
 *
 * Pass this as the `transformRequest` prop on every `<Map>`. Non-Mapbox
 * requests are returned unchanged.
 */
export function mapTransformRequest(url: string): { url: string } {
    let parsed: URL;
    try {
        parsed = new URL(url);
    } catch {
        return { url };
    }

    // Only intercept Mapbox hosts; everything else passes through unchanged.
    if (
        parsed.protocol !== "https:" ||
        (parsed.host !== "mapbox.com" && !parsed.host.endsWith(".mapbox.com"))
    ) {
        return { url };
    }

    // The proxy adds the real token server-side; never ship one to the client.
    parsed.searchParams.delete("access_token");

    const proxied = `${window.location.origin}/api/mapbox/${parsed.host}${parsed.pathname}${parsed.search}`;
    return { url: proxied };
}
