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
import { CountyService } from "./county.service";
import { CreateCountyDto } from "./dto/create-county.dto";
import { UpdateCountyDto } from "./dto/update-county.dto";
import { SessionGuard } from "../auth/session.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/auth.decorators";

@Controller("counties")
export class CountyController {
    constructor(private readonly countyService: CountyService) {}

    @Get()
    findAll() {
        return this.countyService.findAll();
    }

    @Get(":slug")
    findOne(@Param("slug") slug: string) {
        return this.countyService.findOne(slug);
    }

    @Post()
    @UseGuards(SessionGuard, RolesGuard)
    @Roles("admin")
    @HttpCode(HttpStatus.CREATED)
    create(@Body() dto: CreateCountyDto) {
        return this.countyService.create(dto);
    }

    @Patch(":id")
    @UseGuards(SessionGuard, RolesGuard)
    @Roles("admin")
    update(@Param("id") id: string, @Body() dto: UpdateCountyDto) {
        return this.countyService.update(id, dto);
    }

    @Delete(":id")
    @UseGuards(SessionGuard, RolesGuard)
    @Roles("admin")
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@Param("id") id: string) {
        return this.countyService.remove(id);
    }
}
