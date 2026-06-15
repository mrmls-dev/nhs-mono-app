import {
    Injectable,
    ConflictException,
    NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateCommunityDto } from "./dto/create-community.dto";

@Injectable()
export class CommunityService {
    constructor(private readonly prisma: PrismaService) {}

    async findAll() {
        return this.prisma.community.findMany({
            select: {
                id: true,
                slug: true,
                name: true,
                status: true,
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

        const { amenities, floorPlans, schools, countyId, ...core } = dto;

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
                    floorPlans: {
                        create: floorPlans.map(
                            ({ gallery: fpGallery, ...fpCore }) => ({
                                ...fpCore,
                                gallery: {
                                    create: fpGallery.map((m, i) => ({
                                        ...m,
                                        sortOrder: i,
                                    })),
                                },
                            })
                        ),
                    },
                },
                include: {
                    county: { select: { id: true, name: true } },
                    schools: true,
                    amenities: { include: { amenity: true } },
                    floorPlans: { include: { gallery: true } },
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

    async findOne(slug: string) {
        const community = await this.prisma.community.findUnique({
            where: { slug },
            include: {
                county: { select: { id: true, name: true } },
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
                                type: true,
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
