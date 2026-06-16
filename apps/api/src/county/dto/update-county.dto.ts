import { IsString, IsNotEmpty, IsNumber, IsOptional } from "class-validator";
import { Type } from "class-transformer";

export class UpdateCountyDto {
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    name?: string;

    @IsString()
    @IsNotEmpty()
    @IsOptional()
    slug?: string;

    @IsString()
    @IsNotEmpty()
    @IsOptional()
    regionId?: string;

    @IsNumber()
    @Type(() => Number)
    @IsOptional()
    boundsNorth?: number;

    @IsNumber()
    @Type(() => Number)
    @IsOptional()
    boundsSouth?: number;

    @IsNumber()
    @Type(() => Number)
    @IsOptional()
    boundsEast?: number;

    @IsNumber()
    @Type(() => Number)
    @IsOptional()
    boundsWest?: number;
}
