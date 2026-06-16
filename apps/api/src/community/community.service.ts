import {
    Injectable,
    ConflictException,
    NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateCommunityDto } from "./dto/create-community.dto";
import { UpdateCommunityDto } from "./dto/update-community.dto";

@Injectable()
export class CommunityService {
    constructor(private readonly prisma: PrismaService) {}

    async findAll(agentId?: string) {
        // Per-agent scoping: only PUBLISHED communities in the agent's assigned
        // counties, minus the ones the agent has hidden. No counties → empty.
        // No agentId (admin catalog) → full list including drafts.
        let where:
            | {
                  countyId: { in: string[] };
                  published: true;
                  id?: { notIn: string[] };
              }
            | undefined;
        if (agentId) {
            const [counties, hidden] = await Promise.all([
                this.prisma.agentCounty.findMany({
                    where: { organizationId: agentId },
                    select: { countyId: true },
                }),
                this.prisma.agentHiddenCommunity.findMany({
                    where: { organizationId: agentId },
                    select: { communityId: true },
                }),
            ]);
            if (counties.length === 0) return [];
            where = {
                countyId: { in: counties.map((c) => c.countyId) },
                published: true,
                ...(hidden.length > 0
                    ? { id: { notIn: hidden.map((h) => h.communityId) } }
                    : {}),
            };
        }

        return this.prisma.community.findMany({
            where,
            select: {
                id: true,
                slug: true,
                name: true,
                status: true,
                published: true,
                location: true,
                image: true,
                priceFrom: true,
                homesForSale: true,
                bedsMin: true,
                bedsMax: true,
                bathsMin: true,
                bathsMax: true,
                garageMin: true,
                garageMax: true,
                storiesMin: true,
                storiesMax: true,
                sqftFrom: true,
                lat: true,
                lng: true,
                countyId: true,
                county: { select: { id: true, name: true } },
                _count: { select: { floorPlans: true } },
            },
            orderBy: { createdAt: "desc" },
        });
    }

    /** Existing amenity names (alphabetical) for the form's tag autocomplete. */
    async findAmenities() {
        const amenities = await this.prisma.amenity.findMany({
            select: { name: true },
            orderBy: { name: "asc" },
        });
        return amenities.map((a) => a.name);
    }

    async create(dto: CreateCommunityDto) {
        const county = await this.prisma.county.findUnique({
            where: { id: dto.countyId },
            select: { id: true },
        });
        if (!county) {
            throw new NotFoundException(
                `County with id "${dto.countyId}" not found`
            );
        }

        const amenityIds = await Promise.all(
            dto.amenities.map(async (name) => {
                const amenity = await this.prisma.amenity.upsert({
                    where: { name },
                    create: { name },
                    update: {},
                    select: { id: true },
                });
                return amenity.id;
            })
        );

        const { amenities, schools, countyId, ...core } = dto;

        try {
            return await this.prisma.community.create({
                data: {
                    ...core,
                    county: { connect: { id: countyId } },
                    schools: { create: schools },
                    amenities: {
                        create: amenityIds.map((amenityId) => ({
                            amenity: { connect: { id: amenityId } },
                        })),
                    },
                },
                include: {
                    county: { select: { id: true, name: true } },
                    schools: true,
                    amenities: { include: { amenity: true } },
                },
            });
        } catch (err: any) {
            if (err?.code === "P2002") {
                throw new ConflictException(
                    `A community with slug "${dto.slug}" already exists`
                );
            }
            throw err;
        }
    }

    async update(id: string, dto: UpdateCommunityDto) {
        const existing = await this.prisma.community.findUnique({
            where: { id },
            select: { id: true },
        });
        if (!existing) {
            throw new NotFoundException(`Community "${id}" not found`);
        }

        const { amenities, schools, countyId, ...core } = dto;

        if (countyId) {
            const county = await this.prisma.county.findUnique({
                where: { id: countyId },
                select: { id: true },
            });
            if (!county) {
                throw new NotFoundException(
                    `County with id "${countyId}" not found`
                );
            }
        }

        // Resolve amenity names → ids up front (when a new set was supplied).
        const amenityIds = amenities
            ? await Promise.all(
                  amenities.map(async (name) => {
                      const amenity = await this.prisma.amenity.upsert({
                          where: { name },
                          create: { name },
                          update: {},
                          select: { id: true },
                      });
                      return amenity.id;
                  })
              )
            : null;

        try {
            return await this.prisma.community.update({
                where: { id },
                data: {
                    ...core,
                    ...(countyId
                        ? { county: { connect: { id: countyId } } }
                        : {}),
                    ...(schools
                        ? { schools: { deleteMany: {}, create: schools } }
                        : {}),
                    ...(amenityIds
                        ? {
                              amenities: {
                                  deleteMany: {},
                                  create: amenityIds.map((amenityId) => ({
                                      amenity: { connect: { id: amenityId } },
                                  })),
                              },
                          }
                        : {}),
                },
                include: {
                    county: { select: { id: true, name: true } },
                    schools: true,
                    amenities: { include: { amenity: true } },
                },
            });
        } catch (err: any) {
            if (err?.code === "P2002") {
                throw new ConflictException(
                    `A community with slug "${dto.slug}" already exists`
                );
            }
            throw err;
        }
    }

    async findOne(slug: string, agentId?: string) {
        const community = await this.prisma.community.findUnique({
            where: { slug },
            include: {
                county: { select: { id: true, name: true, slug: true } },
                amenities: {
                    include: { amenity: { select: { name: true } } },
                },
                schools: {
                    select: {
                        name: true,
                        type: true,
                        grades: true,
                        distance: true,
                    },
                },
                floorPlans: {
                    orderBy: { startingPrice: "asc" },
                    include: {
                        gallery: {
                            orderBy: { sortOrder: "asc" },
                            select: {
                                src: true,
                                alt: true,
                                caption: true,
                            },
                        },
                    },
                },
            },
        });
        if (!community) {
            throw new NotFoundException(`Community "${slug}" not found`);
        }

        // Agent-scoped request (public white-label site): enforce visibility and
        // apply per-agent model-video overrides. Unscoped (admin) returns as-is.
        if (agentId) {
            const [assigned, hidden] = await Promise.all([
                this.prisma.agentCounty.findUnique({
                    where: {
                        organizationId_countyId: {
                            organizationId: agentId,
                            countyId: community.countyId,
                        },
                    },
                    select: { id: true },
                }),
                this.prisma.agentHiddenCommunity.findUnique({
                    where: {
                        organizationId_communityId: {
                            organizationId: agentId,
                            communityId: community.id,
                        },
                    },
                    select: { id: true },
                }),
            ]);
            if (!community.published || !assigned || hidden) {
                throw new NotFoundException(`Community "${slug}" not found`);
            }

            const overrides = await this.prisma.agentFloorPlanVideo.findMany({
                where: {
                    organizationId: agentId,
                    floorPlanId: { in: community.floorPlans.map((f) => f.id) },
                },
                select: { floorPlanId: true, videoUrl: true },
            });
            if (overrides.length > 0) {
                const map = new Map(
                    overrides.map((o) => [o.floorPlanId, o.videoUrl])
                );
                community.floorPlans = community.floorPlans.map((fp) =>
                    map.has(fp.id) ? { ...fp, modelVideo: map.get(fp.id)! } : fp
                );
            }
        }

        return community;
    }

    async remove(id: string) {
        const community = await this.prisma.community.findUnique({
            where: { id },
            select: { id: true, name: true },
        });
        if (!community) {
            throw new NotFoundException(`Community "${id}" not found`);
        }
        // Cascades defined in schema handle gallery, amenities, schools, floorPlans
        return this.prisma.community.delete({ where: { id } });
    }
}
