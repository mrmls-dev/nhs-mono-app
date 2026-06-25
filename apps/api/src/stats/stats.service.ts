import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class StatsService {
    constructor(private readonly prisma: PrismaService) {}

    /** Catalog-wide totals for the platform admin/owner overview. */
    async overview() {
        const [communities, regions, counties, floorPlans] =
            await this.prisma.$transaction([
                this.prisma.community.count(),
                this.prisma.region.count(),
                this.prisma.county.count(),
                this.prisma.floorPlanModel.count(),
            ]);
        return { communities, regions, counties, floorPlans };
    }
}
