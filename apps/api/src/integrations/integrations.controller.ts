import { Body, Controller, Get, Put, UseGuards } from "@nestjs/common";
import { IntegrationsService } from "./integrations.service";
import { SessionGuard } from "../auth/session.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles, CurrentUser } from "../auth/auth.decorators";
import type { AuthUser } from "../auth/auth.types";
import { UpdateGhlIntegrationDto } from "./dto/update-ghl-integration.dto";

/**
 * Platform integrations (internal). Owner satisfies `admin` via RolesGuard;
 * never exposed to white-label agent tenants.
 */
@Controller("integrations")
@UseGuards(SessionGuard, RolesGuard)
@Roles("admin")
export class IntegrationsController {
    constructor(private readonly service: IntegrationsService) {}

    /** GHL connection status (token never included). */
    @Get("ghl")
    getGhl() {
        return this.service.getGhlStatus();
    }

    /** Save + verify the GHL token / location. */
    @Put("ghl")
    saveGhl(
        @Body() dto: UpdateGhlIntegrationDto,
        @CurrentUser() user: AuthUser
    ) {
        return this.service.saveGhl(dto, user.id);
    }
}
