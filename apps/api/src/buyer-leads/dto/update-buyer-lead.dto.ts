import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";
import { LeadStatus } from "../../marketing-contacts/dto/update-marketing-contact.dto";

/**
 * Fields the agent / platform staff can edit on a buyer lead. Both optional so
 * the UI can PATCH a single field. (Survey answers themselves are immutable.)
 */
export class UpdateBuyerLeadDto {
    @IsOptional()
    @IsEnum(LeadStatus)
    leadStatus?: LeadStatus;

    @IsOptional()
    @IsString()
    @MaxLength(2000)
    note?: string;
}
