import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsInt,
    IsNumber,
    IsArray,
    ValidateNested,
    Min,
    IsUrl,
    ValidateIf,
} from "class-validator";
import { Type } from "class-transformer";

export class MediaDto {
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

export class CreateFloorPlanDto {
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
        (o: CreateFloorPlanDto) =>
            o.modelVideo !== undefined && o.modelVideo !== ""
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
