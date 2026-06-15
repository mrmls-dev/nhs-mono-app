/** DI token for the Better Auth instance (see auth.module.ts). */
export const AUTH_INSTANCE = "AUTH_INSTANCE";

/**
 * Platform-level `user.role` values (the admin plugin's role column — distinct
 * from the org `member.role`).
 *  - `owner`: the platform owner ("us"); full access and can never be deleted.
 *  - `admin`: a platform staff member; uniform access for now (per-role
 *    permissions come later).
 * `owner` is treated as a superset of `admin` by the RolesGuard, so every
 * `@Roles("admin")` route is also reachable by the owner.
 */
export const PLATFORM_OWNER_ROLE = "owner";
export const PLATFORM_ADMIN_ROLE = "admin";
export const PLATFORM_ROLES = [
    PLATFORM_OWNER_ROLE,
    PLATFORM_ADMIN_ROLE,
] as const;
