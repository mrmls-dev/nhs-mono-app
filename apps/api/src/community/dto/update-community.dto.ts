import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsEnum,
    IsInt,
    IsNumber,
    IsArray,
    IsBoolean,
    ValidateNested,
    Min,
} from "class-validator";
import { Type } from "class-transformer";
import { CommunityStatus, SchoolDto } from "./create-community.dto";

export class UpdateCommunityDto {
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    slug?: string;

    @IsString()
    @IsNotEmpty()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    brand?: string;

    @IsString()
    @IsNotEmpty()
    @IsOptional()
    location?: string;

    @IsString()
    @IsNotEmpty()
    @IsOptional()
    image?: string;

    @IsEnum(CommunityStatus)
    @IsOptional()
    status?: CommunityStatus;

    // Publication gate — flip to true to make the community public-eligible.
    @IsBoolean()
    @IsOptional()
    published?: boolean;

    @IsInt()
    @Min(0)
    @IsOptional()
    homesForSale?: number;

    @IsInt()
    @Min(0)
    @IsOptional()
    bedsMin?: number;

    @IsInt()
    @Min(0)
    @IsOptional()
    bedsMax?: number;

    @IsNumber()
    @Min(0)
    @IsOptional()
    bathsMin?: number;

    @IsNumber()
    @Min(0)
    @IsOptional()
    bathsMax?: number;

    @IsInt()
    @Min(0)
    @IsOptional()
    garageMin?: number;

    @IsInt()
    @Min(0)
    @IsOptional()
    garageMax?: number;

    @IsInt()
    @Min(1)
    @IsOptional()
    storiesMin?: number;

    @IsInt()
    @Min(1)
    @IsOptional()
    storiesMax?: number;

    @IsInt()
    @Min(0)
    @IsOptional()
    sqftFrom?: number;

    @IsInt()
    @Min(0)
    @IsOptional()
    priceFrom?: number;

    @IsNumber()
    @IsOptional()
    lat?: number;

    @IsNumber()
    @IsOptional()
    lng?: number;

    @IsString()
    @IsNotEmpty()
    @IsOptional()
    about?: string;

    @IsString()
    @IsNotEmpty()
    @IsOptional()
    countyId?: string;

    // When provided, the amenity set is fully reset to these names.
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    amenities?: string[];

    // When provided, the school list is fully replaced.
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SchoolDto)
    @IsOptional()
    schools?: SchoolDto[];
}
