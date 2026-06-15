import { Global, Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { PrismaService } from "../prisma/prisma.service";
import { createAuth } from "./auth";
import { AUTH_INSTANCE } from "./auth.constants";
import { SessionGuard } from "./session.guard";
import { RolesGuard } from "./roles.guard";

/**
 * Provides the Better Auth instance (built over the shared {@link PrismaService})
 * application-wide. Global so any controller can apply {@link SessionGuard} /
 * {@link RolesGuard} and inject the auth instance.
 */
@Global()
@Module({
    imports: [PrismaModule],
    providers: [
        {
            provide: AUTH_INSTANCE,
            inject: [PrismaService],
            useFactory: (prisma: PrismaService) => createAuth(prisma),
        },
        SessionGuard,
        RolesGuard,
    ],
    exports: [AUTH_INSTANCE, SessionGuard, RolesGuard],
})
export class AuthModule {}
