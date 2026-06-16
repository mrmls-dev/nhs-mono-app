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
import { FloorPlanService } from "./floor-plan.service";
import { CreateFloorPlanDto } from "./dto/create-floor-plan.dto";
import { UpdateFloorPlanDto } from "./dto/update-floor-plan.dto";
import { SessionGuard } from "../auth/session.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/auth.decorators";

// No controller-level prefix: floor plans are addressed both nested under a
// community (create / read by slug) and directly by id (update / delete).
@Controller()
export class FloorPlanController {
    constructor(private readonly floorPlanService: FloorPlanService) {}

    @Get("communities/:communitySlug/plans/:planSlug")
    findOne(
        @Param("communitySlug") communitySlug: string,
        @Param("planSlug") planSlug: string
    ) {
        return this.floorPlanService.findOne(communitySlug, planSlug);
    }

    @Post("communities/:communitySlug/plans")
    @UseGuards(SessionGuard, RolesGuard)
    @Roles("admin")
    @HttpCode(HttpStatus.CREATED)
    create(
        @Param("communitySlug") communitySlug: string,
        @Body() dto: CreateFloorPlanDto
    ) {
        return this.floorPlanService.create(communitySlug, dto);
    }

    @Patch("plans/:id")
    @UseGuards(SessionGuard, RolesGuard)
    @Roles("admin")
    update(@Param("id") id: string, @Body() dto: UpdateFloorPlanDto) {
        return this.floorPlanService.update(id, dto);
    }

    @Delete("plans/:id")
    @UseGuards(SessionGuard, RolesGuard)
    @Roles("admin")
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@Param("id") id: string) {
        return this.floorPlanService.remove(id);
    }
}
