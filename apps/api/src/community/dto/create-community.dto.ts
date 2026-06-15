import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsEnum,
    IsInt,
    IsNumber,
    IsArray,
    ValidateNested,
    Min,
    IsUrl,
    ValidateIf,
} from "class-validator";
import { Type } from "class-transformer";

export enum CommunityStatus {
    NOW_SELLING = "NOW_SELLING",
    COMING_SOON = "COMING_SOON",
    SOLD_OUT = "SOLD_OUT",
}

export enum MediaType {
    IMAGE = "IMAGE",
    VIDEO = "VIDEO",
}

export class MediaDto {
    @IsEnum(MediaType)
    type: MediaType;

    @IsString()
    @IsNotEmpty()
    src: string;

    @IsString()
    @IsNotEmpty()
    alt: string;

    @IsString()
    @IsOptional()
    caption?: string;
}

export class SchoolDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    type: string;

    @IsString()
    @IsNotEmpty()
    grades: string;

    @IsString()
    @IsNotEmpty()
    distance: string;
}

export class FloorPlanDto {
    @IsString()
    @IsNotEmpty()
    slug: string;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    brand?: string;

    @IsInt()
    @Min(0)
    startingPrice: number;

    @IsInt()
    @Min(0)
    beds: number;

    @IsNumber()
    @Min(0)
    baths: number;

    @IsInt()
    @Min(0)
    garage: number;

    @IsInt()
    @Min(1)
    stories: number;

    @IsInt()
    @Min(0)
    sqft: number;

    @IsString()
    @IsNotEmpty()
    image: string;

    @ValidateIf(
        (o: FloorPlanDto) => o.modelVideo !== undefined && o.modelVideo !== ""
    )
    @IsUrl()
    modelVideo?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    diagramImage?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => MediaDto)
    gallery: MediaDto[];
}

export class CreateCommunityDto {
    @IsString()
    @IsNotEmpty()
    slug: string;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    brand?: string;

    @IsString()
    @IsNotEmpty()
    location: string;

    @IsString()
    @IsNotEmpty()
    image: string;

    @IsEnum(CommunityStatus)
    status: CommunityStatus;

    @IsInt()
    @Min(0)
    homesForSale: number;

    @IsInt()
    @Min(0)
    bedsMin: number;

    @IsInt()
    @Min(0)
    bedsMax: number;

    @IsNumber()
    @Min(0)
    bathsMin: number;

    @IsNumber()
    @Min(0)
    bathsMax: number;

    @IsInt()
    @Min(0)
    garageMin: number;

    @IsInt()
    @Min(0)
    garageMax: number;

    @IsInt()
    @Min(1)
    storiesMin: number;

    @IsInt()
    @Min(1)
    storiesMax: number;

    @IsInt()
    @Min(0)
    sqftFrom: number;

    @IsInt()
    @Min(0)
    priceFrom: number;

    @IsNumber()
    lat: number;

    @IsNumber()
    lng: number;

    @IsString()
    @IsNotEmpty()
    about: string;

    @IsString()
    @IsNotEmpty()
    countyId: string;

    @IsArray()
    @IsString({ each: true })
    amenities: string[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SchoolDto)
    schools: SchoolDto[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => FloorPlanDto)
    floorPlans: FloorPlanDto[];
}
