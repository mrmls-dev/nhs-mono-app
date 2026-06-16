import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Patch,
    Post,
    Query,
    UseGuards,
} from "@nestjs/common";
import { CommunityService } from "./community.service";
import { CreateCommunityDto } from "./dto/create-community.dto";
import { UpdateCommunityDto } from "./dto/update-community.dto";
import { SessionGuard } from "../auth/session.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/auth.decorators";

@Controller("communities")
export class CommunityController {
    constructor(private readonly communityService: CommunityService) {}

    // `agentId` (optional) scopes the catalog to a single agent's assigned
    // counties and visible communities; omitted = full platform catalog.
    @Get()
    findAll(@Query("agentId") agentId?: string) {
        return this.communityService.findAll(agentId);
    }

    // Must be declared before ":slug" so it isn't matched as a slug.
    @Get("amenities")
    findAmenities() {
        return this.communityService.findAmenities();
    }

    // `agentId` (optional) enforces white-label visibility and applies the
    // agent's per-floor-plan video overrides; omitted = admin (raw) view.
    @Get(":slug")
    findOne(@Param("slug") slug: string, @Query("agentId") agentId?: string) {
        return this.communityService.findOne(slug, agentId);
    }

    @Post()
    @UseGuards(SessionGuard, RolesGuard)
    @Roles("admin")
    @HttpCode(HttpStatus.CREATED)
    create(@Body() dto: CreateCommunityDto) {
        return this.communityService.create(dto);
    }

    @Patch(":id")
    @UseGuards(SessionGuard, RolesGuard)
    @Roles("admin")
    update(@Param("id") id: string, @Body() dto: UpdateCommunityDto) {
        return this.communityService.update(id, dto);
    }

    @Delete(":id")
    @UseGuards(SessionGuard, RolesGuard)
    @Roles("admin")
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@Param("id") id: string) {
        return this.communityService.remove(id);
    }
}
