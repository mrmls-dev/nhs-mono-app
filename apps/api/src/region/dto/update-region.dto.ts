import { IsString, IsNotEmpty, IsOptional } from "class-validator";

export class UpdateRegionDto {
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
    state?: string;
}
