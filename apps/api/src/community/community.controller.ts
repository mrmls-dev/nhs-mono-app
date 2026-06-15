import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Post,
    UseGuards,
} from "@nestjs/common";
import { CommunityService } from "./community.service";
import { CreateCommunityDto } from "./dto/create-community.dto";
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

    @Delete(":id")
    @UseGuards(SessionGuard, RolesGuard)
    @Roles("admin")
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@Param("id") id: string) {
        return this.communityService.remove(id);
    }
}
