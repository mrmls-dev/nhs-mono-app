import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { VercelModule } from "../vercel/vercel.module";
import { StorageModule } from "../storage/storage.module";
import { AgentService } from "./agent.service";
import { AgentController } from "./agent.controller";

@Module({
    imports: [PrismaModule, VercelModule, StorageModule],
    controllers: [AgentController],
    providers: [AgentService],
    exports: [AgentService],
})
export class AgentModule {}
