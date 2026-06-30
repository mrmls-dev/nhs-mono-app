import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Patch,
    Post,
    Query,
    UseGuards,
} from "@nestjs/common";
import { SessionGuard } from "../auth/session.guard";
import { RolesGuard } from "../auth/roles.guard";
import { CurrentUser } from "../auth/auth.decorators";
import type { AuthUser } from "../auth/auth.types";
import { BuyerLeadsService } from "./buyer-leads.service";
import { CreateBuyerLeadDto } from "./dto/create-buyer-lead.dto";
import { ListBuyerLeadsDto } from "./dto/list-buyer-leads.dto";
import { UpdateBuyerLeadDto } from "./dto/update-buyer-lead.dto";

/**
 * Buyer-match leads. The `POST` is **public** — anonymous marketing-site
 * visitors submit leads, attributed to the agent via `agentId`. Reading/editing
 * is authenticated (guards applied per-method, NOT on the class, so the public
 * submit keeps working): agents see only their own org's leads, platform staff
 * see all.
 */
@Controller("buyer-leads")
export class BuyerLeadsController {
    constructor(private readonly service: BuyerLeadsService) {}

    @Post()
    @HttpCode(HttpStatus.CREATED)
    create(@Body() dto: CreateBuyerLeadDto) {
        return this.service.create(dto);
    }

    /** Paginated leads (newest first) with optional search; scoped by caller. */
    @Get()
    @UseGuards(SessionGuard, RolesGuard)
    findAll(@Query() query: ListBuyerLeadsDto, @CurrentUser() user: AuthUser) {
        return this.service.listLeads(user, query);
    }

    /** Edit a lead's status / note (own-org only for agents; any for staff). */
    @Patch(":id")
    @UseGuards(SessionGuard, RolesGuard)
    update(
        @Param("id") id: string,
        @Body() dto: UpdateBuyerLeadDto,
        @CurrentUser() user: AuthUser
    ) {
        return this.service.update(id, dto, user);
    }
}
