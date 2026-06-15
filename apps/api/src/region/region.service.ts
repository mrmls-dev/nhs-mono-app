import {
    Injectable,
    ConflictException,
    NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateRegionDto } from "./dto/create-region.dto";

@Injectable()
export class RegionService {
    constructor(private readonly prisma: PrismaService) {}

    async findAll() {
        return this.prisma.region.findMany({
            select: {
                id: true,
                name: true,
                slug: true,
                state: true,
                _count: { select: { counties: true } },
            },
            orderBy: { name: "asc" },
        });
    }

    async create(dto: CreateRegionDto) {
        try {
            return await this.prisma.region.create({
                data: {
                    name: dto.name,
                    slug: dto.slug,
                    state: dto.state ?? "Florida",
                },
                select: { id: true, name: true, slug: true, state: true },
            });
        } catch (err: any) {
            if (err?.code === "P2002") {
                throw new ConflictException(
                    `Region with slug "${dto.slug}" already exists`
                );
            }
            throw err;
        }
    }

    async remove(id: string) {
        const region = await this.prisma.region.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                _count: { select: { counties: true } },
            },
        });
        if (!region) {
            throw new NotFoundException(`Region "${id}" not found`);
        }
        if (region._count.counties > 0) {
            throw new ConflictException(
                `Cannot delete "${region.name}" — it still has ${region._count.counties} county(s). Remove those first.`
            );
        }
        return this.prisma.region.delete({ where: { id } });
    }
}
