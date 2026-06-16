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
} from "class-validator";
import { Type } from "class-transformer";

export enum CommunityStatus {
    NOW_SELLING = "NOW_SELLING",
    COMING_SOON = "COMING_SOON",
    SOLD_OUT = "SOLD_OUT",
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

    // NOTE: bed/bath/garage/story ranges, sqftFrom and priceFrom are NOT accepted
    // here. They are derived from the community's floor plans and recomputed by
    // CommunityService.recalcAggregates whenever a floor plan changes. A new
    // community starts with all of them at 0 until its first plan is added.

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
}
