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
import { MediaDto } from "./create-floor-plan.dto";

export class UpdateFloorPlanDto {
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

    @IsInt()
    @Min(0)
    @IsOptional()
    startingPrice?: number;

    @IsInt()
    @Min(0)
    @IsOptional()
    beds?: number;

    @IsNumber()
    @Min(0)
    @IsOptional()
    baths?: number;

    @IsInt()
    @Min(0)
    @IsOptional()
    garage?: number;

    @IsInt()
    @Min(1)
    @IsOptional()
    stories?: number;

    @IsInt()
    @Min(0)
    @IsOptional()
    sqft?: number;

    @IsString()
    @IsNotEmpty()
    @IsOptional()
    image?: string;

    @ValidateIf(
        (o: UpdateFloorPlanDto) =>
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

    // When provided, the gallery is fully replaced with this list.
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => MediaDto)
    @IsOptional()
    gallery?: MediaDto[];
}
