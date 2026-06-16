import { IsArray, IsOptional, IsString, IsUrl } from "class-validator";

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

/**
 * Agent owner / platform staff: set or clear an agent's custom video for a
 * floor plan. An empty/omitted `videoUrl` clears the override (falls back to
 * the floor plan's default model video).
 */
export class SetFloorPlanVideoDto {
    @IsOptional()
    @IsUrl({}, { message: "must be a valid URL" })
    videoUrl?: string;
}
