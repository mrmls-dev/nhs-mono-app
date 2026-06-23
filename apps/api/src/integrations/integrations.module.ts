import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { GhlModule } from "../ghl/ghl.module";
import { IntegrationsController } from "./integrations.controller";
import { IntegrationsService } from "./integrations.service";

@Module({
    imports: [PrismaModule, GhlModule],
    controllers: [IntegrationsController],
    providers: [IntegrationsService],
})
export class IntegrationsModule {}
