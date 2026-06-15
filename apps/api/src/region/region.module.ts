import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { RegionService } from "./region.service";
import { RegionController } from "./region.controller";

@Module({
    imports: [PrismaModule],
    providers: [RegionService],
    controllers: [RegionController],
})
export class RegionModule {}
