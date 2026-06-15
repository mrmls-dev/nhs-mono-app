"use client";

import { createAuthClient } from "better-auth/react";
import { organizationClient, adminClient } from "better-auth/client/plugins";

/**
 * Better Auth browser client. Points at the NestJS API where Better Auth is
 * mounted (`/api/auth`). Cross-origin in dev (web :3000 → api :3001), so every
 * request must send credentials for the session cookie.
 */
export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001",
    fetchOptions: { credentials: "include" },
    plugins: [organizationClient(), adminClient()],
});

export const { useSession, signIn, signOut } = authClient;

/** Platform staff — owner or admin ("us") — vs. white-label agent. */
export function isPlatformAdmin(
    user: { role?: string | null } | null | undefined,
): boolean {
    return user?.role === "admin" || user?.role === "owner";
}
