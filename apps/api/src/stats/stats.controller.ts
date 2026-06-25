import { Controller, Get, UseGuards } from "@nestjs/common";
import { StatsService } from "./stats.service";
import { SessionGuard } from "../auth/session.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/auth.decorators";

@Controller("stats")
export class StatsController {
    constructor(private readonly statsService: StatsService) {}

    @Get("overview")
    @UseGuards(SessionGuard, RolesGuard)
    @Roles("admin")
    overview() {
        return this.statsService.overview();
    }
}
