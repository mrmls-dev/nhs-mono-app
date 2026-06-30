import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from "@nestjs/common";
import { Prisma } from "../../prisma/generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import {
    PLATFORM_ADMIN_ROLE,
    PLATFORM_OWNER_ROLE,
} from "../auth/auth.constants";
import type { AuthUser } from "../auth/auth.types";
import type { CreateBuyerLeadDto } from "./dto/create-buyer-lead.dto";
import type { ListBuyerLeadsDto } from "./dto/list-buyer-leads.dto";
import type { UpdateBuyerLeadDto } from "./dto/update-buyer-lead.dto";

export type PaginatedLeads = {
    data: Awaited<ReturnType<PrismaService["buyerLead"]["findMany"]>>;
    total: number;
    page: number;
    pageSize: number;
};

const isPlatformStaff = (user: AuthUser): boolean =>
    user.role === PLATFORM_OWNER_ROLE || user.role === PLATFORM_ADMIN_ROLE;

@Injectable()
export class BuyerLeadsService {
    constructor(private readonly prisma: PrismaService) {}

    /** Persist a buyer-match survey submission, attributed to its agent. */
    async create(dto: CreateBuyerLeadDto): Promise<{ id: string }> {
        const { agentId, consent, ...answers } = dto;
        try {
            return await this.prisma.buyerLead.create({
                data: {
                    organizationId: agentId,
                    consent: consent ?? false,
                    ...answers,
                },
                select: { id: true },
            });
        } catch (err) {
            // Bad/unknown agent id → foreign-key violation. Surface as 400.
            if (
                err instanceof Prisma.PrismaClientKnownRequestError &&
                err.code === "P2003"
            ) {
                throw new BadRequestException("Unknown agent");
            }
            throw err;
        }
    }

    /**
     * Paginated leads, newest first, with an optional free-text search
     * (name/email/phone). Platform staff see every agent's leads (and may narrow
     * to one via `agentId`); an agent only ever sees their own org's leads.
     */
    async listLeads(
        user: AuthUser,
        params: ListBuyerLeadsDto
    ): Promise<PaginatedLeads> {
        const { page, pageSize, q, agentId } = params;
        const staff = isPlatformStaff(user);

        // Scope: agents are pinned to their own org; the client-supplied
        // `agentId` is honored only for staff (else it could leak other orgs).
        const orgFilter = staff
            ? agentId
                ? { organizationId: agentId }
                : {}
            : { organizationId: await this.resolveOrgId(user.id) };

        // Token search: every word must match SOME field (AND of tokens, OR of
        // fields) — so "Jane Doe" matches firstName="Jane" + lastName="Doe".
        const tokens = q?.trim().split(/\s+/).filter(Boolean) ?? [];

        const where: Prisma.BuyerLeadWhereInput = {
            ...orgFilter,
            ...(tokens.length
                ? {
                      AND: tokens.map((tok) => ({
                          OR: [
                              {
                                  firstName: {
                                      contains: tok,
                                      mode: "insensitive" as const,
                                  },
                              },
                              {
                                  lastName: {
                                      contains: tok,
                                      mode: "insensitive" as const,
                                  },
                              },
                              {
                                  email: {
                                      contains: tok,
                                      mode: "insensitive" as const,
                                  },
                              },
                              { phone: { contains: tok } },
                          ],
                      })),
                  }
                : {}),
        };

        // Read-only counts/lists need no atomicity — a batch `$transaction`
        // intermittently times out (P2028) against the Neon pooler.
        const [data, total] = await Promise.all([
            this.prisma.buyerLead.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * pageSize,
                take: pageSize,
                // Staff need the owning agent's name for the Agent column.
                ...(staff
                    ? {
                          include: {
                              organization: {
                                  select: { id: true, name: true },
                              },
                          },
                      }
                    : {}),
            }),
            this.prisma.buyerLead.count({ where }),
        ]);

        return { data, total, page, pageSize };
    }

    /**
     * Edit a lead's workflow fields (status / note). Agents may only touch leads
     * in their own org; platform staff may edit any.
     */
    async update(id: string, dto: UpdateBuyerLeadDto, user: AuthUser) {
        const lead = await this.prisma.buyerLead.findUnique({ where: { id } });
        if (!lead) throw new NotFoundException("Lead not found");

        if (!isPlatformStaff(user)) {
            const orgId = await this.resolveOrgId(user.id);
            if (lead.organizationId !== orgId) {
                throw new ForbiddenException("Not allowed to manage this lead");
            }
        }

        const data: Prisma.BuyerLeadUpdateInput = {};
        if (dto.leadStatus !== undefined) data.leadStatus = dto.leadStatus;
        if (dto.note !== undefined) data.note = dto.note.trim() || null;

        return this.prisma.buyerLead.update({ where: { id }, data });
    }

    /** The org of the signed-in agent (same lookup as AgentService.getMyAgent). */
    private async resolveOrgId(userId: string): Promise<string> {
        const member = await this.prisma.member.findFirst({
            where: { userId },
            orderBy: { createdAt: "asc" },
            select: { organizationId: true },
        });
        if (!member) throw new NotFoundException("No agent for this user");
        return member.organizationId;
    }
}
