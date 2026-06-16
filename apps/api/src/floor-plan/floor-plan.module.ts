import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { CommunityModule } from "../community/community.module";
import { FloorPlanService } from "./floor-plan.service";
import { FloorPlanController } from "./floor-plan.controller";

@Module({
    imports: [PrismaModule, CommunityModule],
    providers: [FloorPlanService],
    controllers: [FloorPlanController],
})
export class FloorPlanModule {}
