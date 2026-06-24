import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { LeadStatus } from "./update-marketing-contact.dto";

/** Query params for the paginated contacts list. */
export class ListMarketingContactsDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(200)
    pageSize: number = 20;

    /** Free-text search across name / email / phone. */
    @IsOptional()
    @IsString()
    q?: string;

    @IsOptional()
    @IsEnum(LeadStatus)
    status?: LeadStatus;
}
