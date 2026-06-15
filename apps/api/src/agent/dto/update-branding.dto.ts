import { Type } from "class-transformer";
import {
    IsHexColor,
    IsNumber,
    IsObject,
    IsOptional,
    IsString,
    Max,
    MaxLength,
    Min,
    ValidateNested,
} from "class-validator";

/** Per-mode core colors (hex). Foregrounds are derived client/runtime-side. */
class ThemeColorsDto {
    @IsHexColor()
    primary!: string;

    @IsHexColor()
    secondary!: string;

    @IsHexColor()
    accent!: string;
}

class ThemeFontsDto {
    @IsString()
    @MaxLength(40)
    heading!: string;

    @IsString()
    @MaxLength(40)
    body!: string;
}

/** Full theme config persisted (JSON-serialized) on the organization. */
export class ThemeDto {
    @ValidateNested()
    @Type(() => ThemeFontsDto)
    fonts!: ThemeFontsDto;

    @IsNumber()
    @Min(0)
    @Max(2)
    radius!: number;

    @ValidateNested()
    @Type(() => ThemeColorsDto)
    light!: ThemeColorsDto;

    @ValidateNested()
    @Type(() => ThemeColorsDto)
    dark!: ThemeColorsDto;
}

/** Agent (or admin) updates white-label branding for one organization. */
export class UpdateBrandingDto {
    @IsOptional()
    @IsString()
    logo?: string; // R2 URL (uploaded via /storage/upload)

    @IsOptional()
    @IsHexColor()
    brandColor?: string;

    @IsOptional()
    @IsObject()
    @ValidateNested()
    @Type(() => ThemeDto)
    theme?: ThemeDto;

    @IsOptional()
    @IsString()
    @MaxLength(120)
    siteName?: string;

    @IsOptional()
    @IsString()
    @MaxLength(70)
    seoTitle?: string;

    @IsOptional()
    @IsString()
    @MaxLength(70)
    titleSuffix?: string;

    @IsOptional()
    @IsString()
    @MaxLength(200)
    metaDescription?: string;

    @IsOptional()
    @IsString()
    @MaxLength(40)
    contactPhone?: string;

    @IsOptional()
    @IsString()
    @MaxLength(300)
    footerText?: string;

    @IsOptional()
    @IsString()
    @MaxLength(4000)
    ghlScheduleEmbed?: string;
}
