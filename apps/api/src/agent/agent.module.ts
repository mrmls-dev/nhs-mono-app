import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { CloudflareModule } from "../cloudflare/cloudflare.module";
import { AgentService } from "./agent.service";
import { AgentController } from "./agent.controller";

@Module({
    imports: [PrismaModule, CloudflareModule],
    controllers: [AgentController],
    providers: [AgentService],
    exports: [AgentService],
})
export class AgentModule {}
