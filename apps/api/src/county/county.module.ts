import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { CountyService } from "./county.service";
import { CountyController } from "./county.controller";

@Module({
    imports: [PrismaModule],
    providers: [CountyService],
    controllers: [CountyController],
})
export class CountyModule {}
