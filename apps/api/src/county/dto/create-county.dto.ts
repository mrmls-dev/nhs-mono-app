import { IsString, IsNotEmpty, IsNumber } from "class-validator";
import { Type } from "class-transformer";

export class CreateCountyDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    slug: string;

    @IsString()
    @IsNotEmpty()
    regionId: string;

    @IsNumber()
    @Type(() => Number)
    boundsNorth: number;

    @IsNumber()
    @Type(() => Number)
    boundsSouth: number;

    @IsNumber()
    @Type(() => Number)
    boundsEast: number;

    @IsNumber()
    @Type(() => Number)
    boundsWest: number;
}
