import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { VercelModule } from "../vercel/vercel.module";
import { AgentService } from "./agent.service";
import { AgentController } from "./agent.controller";

@Module({
    imports: [PrismaModule, VercelModule],
    controllers: [AgentController],
    providers: [AgentService],
    exports: [AgentService],
})
export class AgentModule {}
