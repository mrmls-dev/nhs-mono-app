import {
    IsBoolean,
    IsEmail,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUrl,
    Matches,
    MaxLength,
    MinLength,
} from "class-validator";

/** Admin-only: create an agent = user + org + owner membership + GHL sub-account data. */
export class CreateAgentDto {
    // ── Owner account (maps to Better Auth User) ─────────────────────────────
    @IsString()
    @IsNotEmpty()
    ownerFirstName!: string;

    @IsString()
    @IsNotEmpty()
    ownerLastName!: string;

    @IsEmail()
    ownerEmail!: string;

    @IsString()
    @MinLength(8)
    password!: string;

    // ── Organization (maps to Better Auth Organization) ───────────────────────
    @IsString()
    @IsNotEmpty()
    name!: string;

    @IsString()
    @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
        message: "slug must be lowercase, alphanumeric, hyphen-separated",
    })
    slug!: string;

    // ── GHL contact / business info ───────────────────────────────────────────

    /** Public contact / business email (GHL prospectInfo.email). Defaults to ownerEmail. */
    @IsOptional()
    @IsEmail()
    businessEmail?: string;

    /** Business phone (GHL `phone`). Stored as contactPhone on the org. */
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
