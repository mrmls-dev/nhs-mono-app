import {
    Injectable,
    ConflictException,
    NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateCountyDto } from "./dto/create-county.dto";

@Injectable()
export class CountyService {
    constructor(private readonly prisma: PrismaService) {}

    async findAll() {
        return this.prisma.county.findMany({
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
