import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";

/** Mirrors the Prisma `LeadStatus` enum (redeclared for class-validator). */
export enum LeadStatus {
    NEW = "NEW",
    ATTEMPTING = "ATTEMPTING",
    CONTACTED = "CONTACTED",
    CONVERTED = "CONVERTED",
    NOT_INTERESTED = "NOT_INTERESTED",
    DO_NOT_CALL = "DO_NOT_CALL",
}

/** Mirrors the Prisma `LastOutreach` enum (redeclared for class-validator). */
export enum LastOutreach {
    NONE = "NONE",
    COLD_CALL = "COLD_CALL",
    VOICEMAIL = "VOICEMAIL",
    TEXT = "TEXT",
}

/**
 * Fields the marketing team can edit on a contact. Only `phone` is synced back
 * to GHL (when it changes); the rest are local-only call-workflow state.
 * All optional so the UI can PATCH a single field.
 */
export class UpdateMarketingContactDto {
    @IsOptional()
    @IsString()
    @MaxLength(40)
    phone?: string;

    @IsOptional()
    @IsEnum(LeadStatus)
    leadStatus?: LeadStatus;

    @IsOptional()
    @IsEnum(LastOutreach)
    lastOutreach?: LastOutreach;

    @IsOptional()
    @IsString()
    @MaxLength(2000)
    note?: string;
}
