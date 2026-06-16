import {
    Injectable,
    ConflictException,
    NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateFloorPlanDto } from "./dto/create-floor-plan.dto";
import { UpdateFloorPlanDto } from "./dto/update-floor-plan.dto";

const planInclude = {
    community: { select: { id: true, slug: true, name: true } },
    gallery: {
        orderBy: { sortOrder: "asc" as const },
        select: { src: true, alt: true, caption: true },
    },
};

@Injectable()
export class FloorPlanService {
    constructor(private readonly prisma: PrismaService) {}

    private async communityIdBySlug(slug: string) {
        const community = await this.prisma.community.findUnique({
            where: { slug },
            select: { id: true },
        });
        if (!community) {
            throw new NotFoundException(`Community "${slug}" not found`);
        }
        return community.id;
    }

    async findOne(communitySlug: string, planSlug: string) {
        const communityId = await this.communityIdBySlug(communitySlug);
        const plan = await this.prisma.floorPlanModel.findUnique({
            where: { communityId_slug: { communityId, slug: planSlug } },
            include: planInclude,
        });
        if (!plan) {
            throw new NotFoundException(
                `Floor plan "${planSlug}" not found in "${communitySlug}"`
            );
        }
        return plan;
    }

    async create(communitySlug: string, dto: CreateFloorPlanDto) {
        const communityId = await this.communityIdBySlug(communitySlug);
        const { gallery, ...core } = dto;
        try {
            return await this.prisma.floorPlanModel.create({
                data: {
                    ...core,
                    community: { connect: { id: communityId } },
                    gallery: {
                        create: gallery.map((m, i) => ({
                            ...m,
                            sortOrder: i,
                        })),
                    },
                },
                include: planInclude,
            });
        } catch (err: any) {
            if (err?.code === "P2002") {
                throw new ConflictException(
                    `A floor plan with slug "${dto.slug}" already exists in this community`
                );
            }
            throw err;
        }
    }

    async update(id: string, dto: UpdateFloorPlanDto) {
        const plan = await this.prisma.floorPlanModel.findUnique({
            where: { id },
            select: { id: true },
        });
        if (!plan) {
            throw new NotFoundException(`Floor plan "${id}" not found`);
        }

        const { gallery, ...core } = dto;
        try {
            return await this.prisma.floorPlanModel.update({
                where: { id },
                data: {
                    ...core,
                    // When a gallery is supplied, replace it wholesale.
                    ...(gallery
                        ? {
                              gallery: {
                                  deleteMany: {},
                                  create: gallery.map((m, i) => ({
                                      ...m,
                                      sortOrder: i,
                                  })),
                              },
                          }
                        : {}),
                },
                include: planInclude,
            });
        } catch (err: any) {
            if (err?.code === "P2002") {
                throw new ConflictException(
                    `A floor plan with slug "${dto.slug}" already exists in this community`
                );
            }
            throw err;
        }
    }

    async remove(id: string) {
        const plan = await this.prisma.floorPlanModel.findUnique({
            where: { id },
            select: { id: true },
        });
        if (!plan) {
            throw new NotFoundException(`Floor plan "${id}" not found`);
        }
        // Gallery rows cascade via schema onDelete: Cascade.
        return this.prisma.floorPlanModel.delete({ where: { id } });
    }
}
