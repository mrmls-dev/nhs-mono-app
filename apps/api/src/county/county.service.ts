import {
    Injectable,
    ConflictException,
    NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateCountyDto } from "./dto/create-county.dto";
import { UpdateCountyDto } from "./dto/update-county.dto";

@Injectable()
export class CountyService {
    constructor(private readonly prisma: PrismaService) {}

    async findOne(slug: string) {
        const county = await this.prisma.county.findUnique({
            where: { slug },
            select: {
                id: true,
                name: true,
                slug: true,
                boundsNorth: true,
                boundsSouth: true,
                boundsEast: true,
                boundsWest: true,
                region: { select: { id: true, name: true, slug: true } },
                communities: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        status: true,
                        image: true,
                        priceFrom: true,
                        _count: { select: { floorPlans: true } },
                    },
                    orderBy: { name: "asc" },
                },
            },
        });
        if (!county) {
            throw new NotFoundException(`County "${slug}" not found`);
        }
        return county;
    }

    async update(id: string, dto: UpdateCountyDto) {
        const county = await this.prisma.county.findUnique({
            where: { id },
            select: { id: true },
        });
        if (!county) {
            throw new NotFoundException(`County "${id}" not found`);
        }
        if (dto.regionId) {
            const region = await this.prisma.region.findUnique({
                where: { id: dto.regionId },
                select: { id: true },
            });
            if (!region) {
                throw new NotFoundException(
                    `Region with id "${dto.regionId}" not found`
                );
            }
        }

        const { regionId, ...rest } = dto;
        try {
            return await this.prisma.county.update({
                where: { id },
                data: {
                    ...rest,
                    ...(regionId
                        ? { region: { connect: { id: regionId } } }
                        : {}),
                },
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    boundsNorth: true,
                    boundsSouth: true,
                    boundsEast: true,
                    boundsWest: true,
                    region: { select: { id: true, name: true } },
                },
            });
        } catch (err: any) {
            if (err?.code === "P2002") {
                throw new ConflictException(
                    `County with slug "${dto.slug}" already exists`
                );
            }
            throw err;
        }
    }

    async findAll(agentId?: string) {
        // Per-agent scoping: only the agent's assigned counties (empty when none).
        let where: { id: { in: string[] } } | undefined;
        if (agentId) {
            const assigned = await this.prisma.agentCounty.findMany({
                where: { organizationId: agentId },
                select: { countyId: true },
            });
            if (assigned.length === 0) return [];
            where = { id: { in: assigned.map((a) => a.countyId) } };
        }

        return this.prisma.county.findMany({
            where,
            select: {
                id: true,
                name: true,
                slug: true,
                boundsNorth: true,
                boundsSouth: true,
                boundsEast: true,
                boundsWest: true,
                region: { select: { id: true, name: true } },
            },
            orderBy: [{ region: { name: "asc" } }, { name: "asc" }],
        });
    }

    async create(dto: CreateCountyDto) {
        const region = await this.prisma.region.findUnique({
            where: { id: dto.regionId },
            select: { id: true },
        });
        if (!region) {
            throw new NotFoundException(
                `Region with id "${dto.regionId}" not found`
            );
        }

        try {
            return await this.prisma.county.create({
                data: {
                    name: dto.name,
                    slug: dto.slug,
                    boundsNorth: dto.boundsNorth,
                    boundsSouth: dto.boundsSouth,
                    boundsEast: dto.boundsEast,
                    boundsWest: dto.boundsWest,
                    region: { connect: { id: dto.regionId } },
                },
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    boundsNorth: true,
                    boundsSouth: true,
                    boundsEast: true,
                    boundsWest: true,
                    region: { select: { id: true, name: true } },
                },
            });
        } catch (err: any) {
            if (err?.code === "P2002") {
                throw new ConflictException(
                    `County with slug "${dto.slug}" already exists`
                );
            }
            throw err;
        }
    }

    async remove(id: string) {
        const county = await this.prisma.county.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                _count: { select: { communities: true } },
            },
        });
        if (!county) {
            throw new NotFoundException(`County "${id}" not found`);
        }
        if (county._count.communities > 0) {
            throw new ConflictException(
                `Cannot delete "${county.name}" — it still has ${county._count.communities} community(s). Remove those first.`
            );
        }
        return this.prisma.county.delete({ where: { id } });
    }
}
