import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { GhlModule } from "../ghl/ghl.module";
import { MarketingContactsController } from "./marketing-contacts.controller";
import { MarketingContactsService } from "./marketing-contacts.service";

@Module({
    imports: [PrismaModule, GhlModule],
    controllers: [MarketingContactsController],
    providers: [MarketingContactsService],
})
export class MarketingContactsModule {}
