import type { NextRequest } from "next/server";

/**
 * Server-side Mapbox proxy for the multi-tenant white-label platform.
 *
 * Every tenant runs on its own custom domain / `{slug}` subdomain, so a
 * URL-restricted public token can't keep up — each new domain would 403 the
 * map. Instead the client's `transformRequest` (see `lib/mapbox.ts`) reroutes
 * all `*.mapbox.com` traffic here, and this handler injects an UNRESTRICTED
 * server token that never reaches the browser. Scales to unlimited tenants.
 *
 * `MAPBOX_SERVER_TOKEN` must be a Mapbox token with map-serving scopes
 * (`styles:read`, `styles:tiles`, `fonts:read`) and NO URL restrictions. Keep
 * it server-only — do NOT prefix it with `NEXT_PUBLIC_`.
 */

const MAPBOX_SERVER_TOKEN = process.env.MAPBOX_SERVER_TOKEN;

/** Lock the upstream host to Mapbox so this can't be used as an open proxy. */
function isAllowedMapboxHost(host: string): boolean {
    return host === "mapbox.com" || host.endsWith(".mapbox.com");
}

/**
 * Reject cross-site use: the map page must be same-origin with the proxy. The
 * token never leaves the server regardless, but this stops other sites from
 * hot-linking the proxy and burning our Mapbox quota. Requests that legitimately
 * omit Origin/Referer are allowed through.
 */
function isSameOrigin(request: NextRequest): boolean {
    const host = request.headers.get("host");
    if (!host) return false;
    const ref = request.headers.get("origin") ?? request.headers.get("referer");
    if (!ref) return true;
    try {
        return new URL(ref).host === host;
    } catch {
        return false;
    }
}

// Headers worth forwarding back to the browser; notably NOT content-encoding /
// content-length (fetch already decoded the body, so re-advertising them would
// corrupt the response).
const PASSTHROUGH_HEADERS = [
    "content-type",
    "cache-control",
    "etag",
    "expires",
    "last-modified",
];

async function proxy(request: NextRequest, segments: string[]): Promise<Response> {
    if (!MAPBOX_SERVER_TOKEN) {
        return new Response("Mapbox proxy not configured", { status: 503 });
    }
    if (!isSameOrigin(request)) {
        return new Response("Forbidden", { status: 403 });
    }

    const [host, ...rest] = segments;
    if (!host || !isAllowedMapboxHost(host)) {
        return new Response("Bad upstream host", { status: 400 });
    }

    const upstream = new URL(`https://${host}/${rest.join("/")}`);
    // Carry over the original query (style params, etc.), then force our token.
    for (const [key, value] of new URL(request.url).searchParams) {
        if (key !== "access_token") upstream.searchParams.append(key, value);
    }
    upstream.searchParams.set("access_token", MAPBOX_SERVER_TOKEN);

    const upstreamRes = await fetch(upstream, {
        method: request.method,
        headers: {
            "user-agent": request.headers.get("user-agent") ?? "nhs-map-proxy",
        },
        body:
            request.method === "POST"
                ? await request.arrayBuffer()
                : undefined,
    });

    const headers = new Headers();
    for (const name of PASSTHROUGH_HEADERS) {
        const value = upstreamRes.headers.get(name);
        if (value) headers.set(name, value);
    }
    // Tiles/styles/fonts are effectively immutable — let the edge cache them.
    if (!headers.has("cache-control")) {
        headers.set("cache-control", "public, max-age=3600");
    }

    return new Response(upstreamRes.body, {
        status: upstreamRes.status,
        headers,
    });
}

type RouteContext = { params: Promise<{ path: string[] }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
    return proxy(request, (await params).path);
}

export async function POST(request: NextRequest, { params }: RouteContext) {
    return proxy(request, (await params).path);
}

export async function HEAD(request: NextRequest, { params }: RouteContext) {
    return proxy(request, (await params).path);
}
