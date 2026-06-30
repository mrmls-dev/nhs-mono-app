import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { BuyerLeadsController } from "./buyer-leads.controller";
import { BuyerLeadsService } from "./buyer-leads.service";

@Module({
    imports: [PrismaModule],
    controllers: [BuyerLeadsController],
    providers: [BuyerLeadsService],
})
export class BuyerLeadsModule {}
