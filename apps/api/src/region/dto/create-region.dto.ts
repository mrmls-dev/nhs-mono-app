import { IsString, IsNotEmpty, IsOptional } from "class-validator";

export class CreateRegionDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    slug: string;

    @IsString()
    @IsOptional()
    state?: string;
}
