import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * Canonical host the dashboard lives on (e.g. `app.nationalhousesearch.com`).
 * Agent subdomains and custom domains serve only the public marketing site, so
 * `/dashboard` on any other host is bounced here. Unset in local dev → every
 * host (i.e. `localhost`) may serve the dashboard.
 */
const CANONICAL_HOST = process.env.NEXT_PUBLIC_APP_HOST?.toLowerCase().trim();

/**
 * Gates the dashboard. Two jobs:
 *  1. Keep the dashboard on the canonical host only — a logged-in agent's auth
 *     cookie is shared across `.nationalhousesearch.com`, so without this the
 *     dashboard would also render on their public subdomain.
 *  2. Lightweight cookie-presence check for UX (fast redirect to /login). The
 *     NestJS API independently validates every session, so it is the real
 *     access-control boundary.
 *
 * In dev the Better Auth cookie is set by the API origin (:3001) but is
 * host-only on `localhost`, so it is visible here on :3000.
 *
 * Next 16 renamed the `middleware` file convention to `proxy`.
 */
export function proxy(request: NextRequest) {
    // Off-canonical-host dashboard requests → canonical host, same path.
    const host = request.headers.get("host")?.toLowerCase().split(":")[0];
    if (CANONICAL_HOST && host && host !== CANONICAL_HOST) {
        const url = request.nextUrl.clone();
        url.protocol = "https:";
        url.host = CANONICAL_HOST;
        url.port = "";
        return NextResponse.redirect(url);
    }

    const sessionCookie = getSessionCookie(request);
    if (!sessionCookie) {
        const loginUrl = new URL("/login", request.url);
        return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
}

export const config = {
    matcher: ["/dashboard/:path*"],
};
