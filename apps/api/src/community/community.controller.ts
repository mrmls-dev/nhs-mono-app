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

    @Get()
    findAll() {
        return this.communityService.findAll();
    }

    // Must be declared before ":slug" so it isn't matched as a slug.
    @Get("amenities")
    findAmenities() {
        return this.communityService.findAmenities();
    }

    @Get(":slug")
    findOne(@Param("slug") slug: string) {
        return this.communityService.findOne(slug);
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
