import { IsArray, IsString } from "class-validator";

/** Platform staff: replace the set of counties assigned to an agent. */
export class SetCountiesDto {
    @IsArray()
    @IsString({ each: true })
    countyIds!: string[];
}

/**
 * Agent owner / platform staff: replace the set of communities the agent has
 * hidden (turned off). Communities default to visible, so this lists exceptions.
 */
export class SetHiddenCommunitiesDto {
    @IsArray()
    @IsString({ each: true })
    communityIds!: string[];
}
