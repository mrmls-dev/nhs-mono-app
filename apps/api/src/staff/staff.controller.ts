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
import { StaffService } from "./staff.service";
import { SessionGuard } from "../auth/session.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles, CurrentUser } from "../auth/auth.decorators";
import type { AuthUser } from "../auth/auth.types";
import { CreateStaffDto } from "./dto/create-staff.dto";
import { UpdateStaffDto } from "./dto/update-staff.dto";

/** Platform staff (owner + admin-role users). Admin-only across the board. */
@Controller("staff")
@UseGuards(SessionGuard, RolesGuard)
@Roles("admin")
export class StaffController {
    constructor(private readonly staffService: StaffService) {}

    /** Admin: list every platform staff member. */
    @Get()
    findAll() {
        return this.staffService.listStaff();
    }

    /** Admin: add a platform staff member (admin-role user + login). */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    create(@Body() dto: CreateStaffDto) {
        return this.staffService.createStaff(dto);
    }

    /** Admin: edit a member's name + email. */
    @Patch(":id")
    update(@Param("id") id: string, @Body() dto: UpdateStaffDto) {
        return this.staffService.updateStaff(id, dto);
    }

    /** Admin: delete a member (the owner and your own account are protected). */
    @Delete(":id")
    remove(@Param("id") id: string, @CurrentUser() user: AuthUser) {
        return this.staffService.deleteStaff(id, user.id);
    }
}
