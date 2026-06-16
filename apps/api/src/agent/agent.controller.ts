import {
    Body,
    Controller,
    Delete,
    ForbiddenException,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Patch,
    Post,
    Put,
    Query,
    Req,
    UseGuards,
} from "@nestjs/common";
import { fromNodeHeaders } from "better-auth/node";
import { AgentService } from "./agent.service";
import { SessionGuard } from "../auth/session.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Public, Roles, CurrentUser } from "../auth/auth.decorators";
import {
    PLATFORM_ADMIN_ROLE,
    PLATFORM_OWNER_ROLE,
} from "../auth/auth.constants";
import type { AuthUser, AuthedRequest } from "../auth/auth.types";
import { CreateAgentDto } from "./dto/create-agent.dto";
import { UpdateAgentDto } from "./dto/update-agent.dto";
import { UpdateBrandingDto } from "./dto/update-branding.dto";
import { ServiceStatusDto } from "./dto/service-status.dto";
import { SetDomainDto } from "./dto/domain.dto";
import { SetCountiesDto, SetHiddenCommunitiesDto } from "./dto/coverage.dto";

@Controller("agents")
@UseGuards(SessionGuard, RolesGuard)
export class AgentController {
    constructor(private readonly agentService: AgentService) {}

    /** Admin: list every agent. */
    @Get()
    @Roles("admin")
    findAll() {
        return this.agentService.listAgents();
    }

    /** Agent: my own org. */
    @Get("me")
    getMine(@CurrentUser() user: AuthUser) {
        return this.agentService.getMyAgent(user.id);
    }

    /** Public: resolve the agent for a marketing-site request by Host. */
    @Get("by-domain")
    @Public()
    byDomain(
        @Query("host") hostQuery: string | undefined,
        @Req() req: AuthedRequest
    ) {
        const host = hostQuery ?? (req.headers["host"] as string | undefined);
        return this.agentService.getByDomain(host);
    }

    /** Admin: create an agent (user + org + owner membership). */
    @Post()
    @Roles("admin")
    @HttpCode(HttpStatus.CREATED)
    create(@Body() dto: CreateAgentDto, @Req() req: AuthedRequest) {
        return this.agentService.createAgent(dto, fromNodeHeaders(req.headers));
    }

    /** Admin-only: edit an agent's profile (owner identity + org/business/GHL). */
    @Patch(":id")
    @Roles("admin")
    update(@Param("id") id: string, @Body() dto: UpdateAgentDto) {
        return this.agentService.updateAgent(id, dto);
    }

    /** Admin-only: permanently delete an agent and all related records. */
    @Delete(":id")
    @Roles("admin")
    remove(@Param("id") id: string) {
        return this.agentService.deleteAgent(id);
    }

    /** Admin OR the agent that owns this org. */
    @Patch(":id/branding")
    async updateBranding(
        @Param("id") id: string,
        @Body() dto: UpdateBrandingDto,
        @CurrentUser() user: AuthUser
    ) {
        await this.assertManager(user, id);
        return this.agentService.updateBranding(id, dto);
    }

    /** Admin-only: subscription/payment gate. */
    @Patch(":id/service-status")
    @Roles("admin")
    setServiceStatus(@Param("id") id: string, @Body() dto: ServiceStatusDto) {
        return this.agentService.setServiceStatus(id, dto.serviceStatus);
    }

    @Patch(":id/domain")
    async setDomain(
        @Param("id") id: string,
        @Body() dto: SetDomainDto,
        @CurrentUser() user: AuthUser
    ) {
        await this.assertManager(user, id);
        return this.agentService.setDomain(id, dto.domain.toLowerCase());
    }

    /** Live DNS setup (routing record + any TXT challenge) from Vercel. */
    @Get(":id/domain")
    async domainSetup(@Param("id") id: string, @CurrentUser() user: AuthUser) {
        await this.assertManager(user, id);
        return this.agentService.getDomainSetup(id);
    }

    @Get(":id/domain/status")
    async domainStatus(@Param("id") id: string, @CurrentUser() user: AuthUser) {
        await this.assertManager(user, id);
        return this.agentService.refreshDomainStatus(id);
    }

    @Delete(":id/domain")
    @HttpCode(HttpStatus.NO_CONTENT)
    async removeDomain(@Param("id") id: string, @CurrentUser() user: AuthUser) {
        await this.assertManager(user, id);
        return this.agentService.removeDomain(id);
    }

    // ── Coverage: counties (platform staff) + community visibility (staff/owner) ──

    /** Platform staff: the counties assigned to an agent. */
    @Get(":id/counties")
    @Roles("admin")
    getCounties(@Param("id") id: string) {
        return this.agentService.getAssignedCounties(id);
    }

    /** Platform staff: replace an agent's assigned counties. */
    @Put(":id/counties")
    @Roles("admin")
    setCounties(@Param("id") id: string, @Body() dto: SetCountiesDto) {
        return this.agentService.setAssignedCounties(id, dto.countyIds);
    }

    /** Staff or the agent owner: communities in assigned counties + hidden flags. */
    @Get(":id/communities")
    async getCommunities(
        @Param("id") id: string,
        @CurrentUser() user: AuthUser
    ) {
        await this.assertManager(user, id);
        return this.agentService.getManagedCommunities(id);
    }

    /** Staff or the agent owner: replace the hidden (disabled) community set. */
    @Put(":id/communities/hidden")
    async setHiddenCommunities(
        @Param("id") id: string,
        @Body() dto: SetHiddenCommunitiesDto,
        @CurrentUser() user: AuthUser
    ) {
        await this.assertManager(user, id);
        return this.agentService.setHiddenCommunities(id, dto.communityIds);
    }

    /** Allow platform staff (owner/admin), or owners/admins of the target org. */
    private async assertManager(user: AuthUser, orgId: string) {
        if (
            user.role === PLATFORM_OWNER_ROLE ||
            user.role === PLATFORM_ADMIN_ROLE
        ) {
            return;
        }
        if (await this.agentService.isOrgManager(user.id, orgId)) return;
        throw new ForbiddenException("Not allowed to manage this agent");
    }
}
