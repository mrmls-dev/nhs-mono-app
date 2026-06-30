import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class StatsService {
    constructor(private readonly prisma: PrismaService) {}

    /** Catalog-wide totals for the platform admin/owner overview. */
    async overview() {
        // Plain counts need no atomicity; a batch `$transaction` intermittently
        // times out (P2028) starting a transaction against the Neon pooler.
        const [communities, regions, counties, floorPlans] = await Promise.all([
            this.prisma.community.count(),
            this.prisma.region.count(),
            this.prisma.county.count(),
            this.prisma.floorPlanModel.count(),
        ]);
        return { communities, regions, counties, floorPlans };
    }
}
