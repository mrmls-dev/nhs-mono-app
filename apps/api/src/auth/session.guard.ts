import {
    CanActivate,
    ExecutionContext,
    Inject,
    Injectable,
    UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { fromNodeHeaders } from "better-auth/node";
import { AUTH_INSTANCE } from "./auth.constants";
import { IS_PUBLIC_KEY } from "./auth.decorators";
import type { Auth } from "./auth";
import type { AuthedRequest } from "./auth.types";

/**
 * Validates the Better Auth session on the incoming request and attaches
 * `req.user` / `req.session`. Routes/controllers marked `@Public()` are skipped.
 */
@Injectable()
export class SessionGuard implements CanActivate {
    constructor(
        @Inject(AUTH_INSTANCE) private readonly auth: Auth,
        private readonly reflector: Reflector
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const isPublic = this.reflector.getAllAndOverride<boolean>(
            IS_PUBLIC_KEY,
            [context.getHandler(), context.getClass()]
        );
        if (isPublic) return true;

        const req = context.switchToHttp().getRequest<AuthedRequest>();
        const result = await this.auth.api.getSession({
            headers: fromNodeHeaders(req.headers),
        });

        if (!result) {
            throw new UnauthorizedException("Authentication required");
        }

        req.user = result.user;
        req.session = result.session;
        return true;
    }
}
