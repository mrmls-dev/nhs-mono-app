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
import { RegionService } from "./region.service";
import { CreateRegionDto } from "./dto/create-region.dto";
import { UpdateRegionDto } from "./dto/update-region.dto";
import { SessionGuard } from "../auth/session.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/auth.decorators";

@Controller("regions")
export class RegionController {
    constructor(private readonly regionService: RegionService) {}

    @Get()
    findAll() {
        return this.regionService.findAll();
    }

    @Get(":slug")
    findOne(@Param("slug") slug: string) {
        return this.regionService.findOne(slug);
    }

    @Post()
    @UseGuards(SessionGuard, RolesGuard)
    @Roles("admin")
    @HttpCode(HttpStatus.CREATED)
    create(@Body() dto: CreateRegionDto) {
        return this.regionService.create(dto);
    }

    @Patch(":id")
    @UseGuards(SessionGuard, RolesGuard)
    @Roles("admin")
    update(@Param("id") id: string, @Body() dto: UpdateRegionDto) {
        return this.regionService.update(id, dto);
    }

    @Delete(":id")
    @UseGuards(SessionGuard, RolesGuard)
    @Roles("admin")
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@Param("id") id: string) {
        return this.regionService.remove(id);
    }
}
