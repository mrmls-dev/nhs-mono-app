import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { FloorPlanService } from "./floor-plan.service";
import { FloorPlanController } from "./floor-plan.controller";

@Module({
    imports: [PrismaModule],
    providers: [FloorPlanService],
    controllers: [FloorPlanController],
})
export class FloorPlanModule {}
