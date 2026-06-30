import {
    IsBoolean,
    IsEmail,
    IsInt,
    IsOptional,
    IsString,
    MaxLength,
    MinLength,
} from "class-validator";

/**
 * Public buyer-match survey submission. `agentId` is the Organization id of the
 * white-label site the survey ran on (resolved server-side from the request
 * Host on the marketing page), so the lead is attributed to the right agent.
 */
export class CreateBuyerLeadDto {
    @IsString()
    @MinLength(1)
    agentId!: string;

    @IsString()
    @MinLength(1)
    @MaxLength(100)
    firstName!: string;

    @IsString()
    @MinLength(1)
    @MaxLength(100)
    lastName!: string;

    @IsEmail()
    @MaxLength(200)
    email!: string;

    @IsString()
    @MinLength(7)
    @MaxLength(40)
    phone!: string;

    @IsOptional()
    @IsBoolean()
    consent?: boolean;

    @IsOptional()
    @IsString()
    @MaxLength(120)
    location?: string;

    @IsOptional()
    @IsString()
    @MaxLength(60)
    countyId?: string;

    @IsOptional()
    @IsString()
    @MaxLength(40)
    homeType?: string;

    @IsOptional()
    @IsString()
    @MaxLength(10)
    bedrooms?: string;

    @IsOptional()
    @IsString()
    @MaxLength(10)
    bathrooms?: string;

    @IsOptional()
    @IsString()
    @MaxLength(40)
    budget?: string;

    @IsOptional()
    @IsInt()
    matchCount?: number;
}
