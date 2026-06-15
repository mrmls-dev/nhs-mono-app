import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY } from "./auth.decorators";
import { PLATFORM_ADMIN_ROLE, PLATFORM_OWNER_ROLE } from "./auth.constants";
import type { AuthedRequest } from "./auth.types";

/**
 * Enforces `@Roles(...)` against the platform-level user role (admin plugin).
 * Must run after {@link SessionGuard}, which populates `req.user`.
 * Use `@Roles("admin")` to restrict an endpoint to platform super-admins.
 */
@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const required = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!required || required.length === 0) return true;

        const req = context.switchToHttp().getRequest<AuthedRequest>();
        const role = req.user?.role ?? undefined;

        // The platform owner is a superset of admin — it satisfies any route
        // that only requires the admin role.
        const satisfied =
            !!role &&
            (required.includes(role) ||
                (role === PLATFORM_OWNER_ROLE &&
                    required.includes(PLATFORM_ADMIN_ROLE)));

        if (!satisfied) {
            throw new ForbiddenException("Insufficient permissions");
        }
        return true;
    }
}
