import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { RegionModule } from "./region/region.module";
import { CountyModule } from "./county/county.module";
import { CommunityModule } from "./community/community.module";
import { FloorPlanModule } from "./floor-plan/floor-plan.module";
import { StorageModule } from "./storage/storage.module";
import { AgentModule } from "./agent/agent.module";
import { StaffModule } from "./staff/staff.module";
import { MarketingContactsModule } from "./marketing-contacts/marketing-contacts.module";
import { IntegrationsModule } from "./integrations/integrations.module";
import { StatsModule } from "./stats/stats.module";
import { CryptoModule } from "./common/crypto.module";

@Module({
    imports: [
        PrismaModule,
        AuthModule,
        CryptoModule,
        RegionModule,
        CountyModule,
        CommunityModule,
        FloorPlanModule,
        StorageModule,
        AgentModule,
        StaffModule,
        MarketingContactsModule,
        IntegrationsModule,
        StatsModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule {}
