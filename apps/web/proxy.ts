import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * Gates the dashboard. This is a lightweight cookie-presence check for UX
 * (fast redirect to /login); the NestJS API independently validates every
 * session, so it is the real access-control boundary.
 *
 * In dev the Better Auth cookie is set by the API origin (:3001) but is
 * host-only on `localhost`, so it is visible here on :3000.
 *
 * Next 16 renamed the `middleware` file convention to `proxy`.
 */
export function proxy(request: NextRequest) {
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
