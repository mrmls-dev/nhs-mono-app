import {
    IsBoolean,
    IsEmail,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUrl,
    Matches,
    MaxLength,
} from "class-validator";

/**
 * Admin-only: edit an agent's profile. Mirrors {@link CreateAgentDto} minus the
 * password (password resets are a separate concern). Owner name/email update the
 * Better Auth User; everything else updates the Organization.
 */
export class UpdateAgentDto {
    // ── Owner account (maps to Better Auth User) ─────────────────────────────
    @IsString()
    @IsNotEmpty()
    ownerFirstName!: string;

    @IsString()
    @IsNotEmpty()
    ownerLastName!: string;

    @IsEmail()
    ownerEmail!: string;

    // ── Organization ──────────────────────────────────────────────────────────
    @IsString()
    @IsNotEmpty()
    name!: string;

    @IsString()
    @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
        message: "slug must be lowercase, alphanumeric, hyphen-separated",
    })
    slug!: string;

    // ── GHL contact / business info ───────────────────────────────────────────
    @IsOptional()
    @IsEmail()
    businessEmail?: string;

    @IsOptional()
    @IsString()
    @MaxLength(40)
    contactPhone?: string;

    @IsOptional()
    @IsUrl({}, { message: "Enter a valid URL, e.g. https://example.com" })
    @MaxLength(200)
    website?: string;

    @IsOptional()
    @IsString()
    @MaxLength(80)
    businessType?: string;

    // ── Address ───────────────────────────────────────────────────────────────
    @IsOptional()
    @IsString()
    @MaxLength(200)
    address?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    city?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    state?: string;

    @IsOptional()
    @IsString()
    @MaxLength(20)
    postalCode?: string;

    @IsOptional()
    @IsString()
    @MaxLength(10)
    country?: string;

    @IsOptional()
    @IsString()
    @MaxLength(60)
    timezone?: string;

    // ── GHL location settings ─────────────────────────────────────────────────
    @IsOptional()
    @IsBoolean()
    ghlAllowDuplicateContact?: boolean;

    @IsOptional()
    @IsBoolean()
    ghlAllowDuplicateOpportunity?: boolean;

    @IsOptional()
    @IsBoolean()
    ghlAllowFacebookNameMerge?: boolean;

    @IsOptional()
    @IsBoolean()
    ghlDisableContactTimezone?: boolean;
}
