import type { Auth } from "./auth";

/** The session shape returned by `auth.api.getSession`. */
export type AuthSessionResult = Awaited<ReturnType<Auth["api"]["getSession"]>>;

export type AuthUser = NonNullable<AuthSessionResult>["user"];
export type AuthSession = NonNullable<AuthSessionResult>["session"];

/** Express request augmented by {@link SessionGuard}. */
export interface AuthedRequest {
    user?: AuthUser;
    session?: AuthSession;
    headers: Record<string, string | string[] | undefined>;
}
