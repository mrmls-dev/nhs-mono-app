import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { GhlService } from "./ghl.service";

@Module({
    imports: [PrismaModule],
    providers: [GhlService],
    exports: [GhlService],
})
export class GhlModule {}
