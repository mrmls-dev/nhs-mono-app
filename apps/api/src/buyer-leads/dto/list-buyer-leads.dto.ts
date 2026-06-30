import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Max, Min } from "class-validator";

/** Query params for the paginated buyer-leads list. */
export class ListBuyerLeadsDto {
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

    /** Admin-only: narrow to a single agent's org. Ignored for agent callers. */
    @IsOptional()
    @IsString()
    agentId?: string;
}
