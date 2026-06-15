import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { RegionModule } from "./region/region.module";
import { CountyModule } from "./county/county.module";
import { CommunityModule } from "./community/community.module";
import { StorageModule } from "./storage/storage.module";
import { AgentModule } from "./agent/agent.module";
import { StaffModule } from "./staff/staff.module";

@Module({
    imports: [
        PrismaModule,
        AuthModule,
        RegionModule,
        CountyModule,
        CommunityModule,
        StorageModule,
        AgentModule,
        StaffModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule {}
