import { IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

/**
 * Save the GHL connection. `apiToken` is optional so you can edit the location
 * without re-entering the token (omit/blank → keep the stored one); it is
 * required only on first setup. The token is write-only — never read back.
 */
export class UpdateGhlIntegrationDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    locationId!: string;

    @IsOptional()
    @IsString()
    @MaxLength(300)
    apiToken?: string;
}
