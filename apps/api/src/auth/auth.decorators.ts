import {
    SetMetadata,
    createParamDecorator,
    type ExecutionContext,
} from "@nestjs/common";
import type { AuthSession, AuthUser } from "./auth.types";

/** Mark a route/controller as public — skips {@link SessionGuard}. */
export const IS_PUBLIC_KEY = "isPublic";
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/**
 * Restrict a route to the given platform-level user roles (admin plugin).
 * Use `@Roles("admin")` for platform-super-admin-only endpoints.
 */
export const ROLES_KEY = "roles";
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

/** Inject the authenticated user attached by {@link SessionGuard}. */
export const CurrentUser = createParamDecorator(
    (_data: unknown, ctx: ExecutionContext): AuthUser | undefined => {
        return ctx.switchToHttp().getRequest().user;
    }
);

/** Inject the Better Auth session attached by {@link SessionGuard}. */
export const CurrentSession = createParamDecorator(
    (_data: unknown, ctx: ExecutionContext): AuthSession | undefined => {
        return ctx.switchToHttp().getRequest().session;
    }
);
