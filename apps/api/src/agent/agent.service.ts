import {
    BadRequestException,
    ConflictException,
    Inject,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CloudflareService } from "../cloudflare/cloudflare.service";
import {
    AUTH_INSTANCE,
    PLATFORM_ADMIN_ROLE,
    PLATFORM_OWNER_ROLE,
} from "../auth/auth.constants";
import type { Auth } from "../auth/auth";
import type { CreateAgentDto } from "./dto/create-agent.dto";
import type { UpdateAgentDto } from "./dto/update-agent.dto";
import type { UpdateBrandingDto } from "./dto/update-branding.dto";

/** Org row + its owner — shaped for the admin Agents table. */
const orgWithOwner = {
    members: {
        where: { role: "owner" },
        take: 1,
        include: { user: { select: { name: true, email: true } } },
    },
} as const;

@Injectable()
export class AgentService {
    constructor(
        @Inject(AUTH_INSTANCE) private readonly auth: Auth,
        private readonly prisma: PrismaService,
        private readonly cloudflare: CloudflareService
    ) {}

    // ── Reads ────────────────────────────────────────────────────────────────

    /** Admin: every agent org with branding, service status, and owner. */
    async listAgents() {
        const orgs = await this.prisma.organization.findMany({
            orderBy: { createdAt: "desc" },
            include: orgWithOwner,
        });
        return orgs.map((o) => this.toAdminAgent(o));
    }

    /** The org the signed-in user owns/belongs to (agent dashboard). */
    async getMyAgent(userId: string) {
        const member = await this.prisma.member.findFirst({
            where: { userId },
            orderBy: { createdAt: "asc" },
            include: { organization: { include: orgWithOwner } },
        });
        if (!member) throw new NotFoundException("No agent for this user");
        return this.toAdminAgent(member.organization);
    }

    async getAgentById(id: string) {
        const org = await this.prisma.organization.findUnique({
            where: { id },
            include: orgWithOwner,
        });
        if (!org) throw new NotFoundException("Agent not found");
        return this.toAdminAgent(org);
    }

    /**
     * Public: resolve the agent for a marketing-site request by Host header.
     * Resolution order:
     *   1. exact custom domain  (reyesrealtygroup.com)
     *   2. platform subdomain   ({slug}.{AGENT_SUBDOMAIN_BASE}) — every agent
     *      gets one for free, no custom domain required
     *   3. default platform org (canonical host, bare base domain, anything else)
     * Returns only public-safe fields (incl. `serviceStatus` so the layout can
     * gate suspended sites).
     */
    async getByDomain(host: string | undefined) {
        const domain = normalizeHost(host);
        const org =
            (await this.resolveByCustomDomain(domain)) ??
            (await this.resolveBySubdomain(domain)) ??
            (await this.getDefaultOrg());
        if (!org) throw new NotFoundException("No agent configured");
        return this.toPublicAgent(org);
    }

    private resolveByCustomDomain(domain: string | null) {
        if (!domain) return null;
        return this.prisma.organization.findUnique({
            where: { customDomain: domain },
        });
    }

    /** Match `{slug}.{AGENT_SUBDOMAIN_BASE}` → org by slug. */
    private resolveBySubdomain(domain: string | null) {
        const base = subdomainBase();
        if (!domain || !base || !domain.endsWith(`.${base}`)) return null;
        const label = domain.slice(0, -(base.length + 1));
        // Single-label only (no nested subdomains) and not a reserved host.
        if (!label || label.includes(".") || RESERVED_SUBDOMAINS.has(label)) {
            return null;
        }
        return this.prisma.organization.findUnique({ where: { slug: label } });
    }

    private async getDefaultOrg() {
        const slug = process.env.DEFAULT_AGENT_SLUG ?? "national-house-search";
        return (
            (await this.prisma.organization.findUnique({ where: { slug } })) ??
            (await this.prisma.organization.findFirst({
                orderBy: { createdAt: "asc" },
            }))
        );
    }

    // ── Writes ───────────────────────────────────────────────────────────────

    /** Admin-only: create user + organization + owner membership in one shot. */
    async createAgent(dto: CreateAgentDto, adminHeaders: Headers) {
        const existing = await this.prisma.user.findUnique({
            where: { email: dto.ownerEmail },
        });
        if (existing) throw new ConflictException("Email already in use");

        const slugTaken = await this.prisma.organization.findUnique({
            where: { slug: dto.slug },
        });
        if (slugTaken) throw new ConflictException("Slug already in use");

        // 1) Create the owner user (admin plugin; verified, no signup flow).
        const fullName = `${dto.ownerFirstName} ${dto.ownerLastName}`.trim();
        const created = await this.auth.api.createUser({
            headers: adminHeaders,
            body: {
                name: fullName,
                email: dto.ownerEmail,
                password: dto.password,
            },
        });
        const userId = created.user.id;

        // 2) Create their organization (owner membership auto-assigned).
        //    `userId` is set server-side, so no session headers here.
        try {
            await this.auth.api.createOrganization({
                body: {
                    name: dto.name,
                    slug: dto.slug,
                    userId,
                    siteName: dto.name,
                },
            });
        } catch (err) {
            // Roll back the orphaned user so the admin can retry cleanly.
            await this.prisma.user
                .delete({ where: { id: userId } })
                .catch(() => undefined);
            throw new InternalServerErrorException(
                `Failed to create organization: ${(err as Error).message}`
            );
        }

        // 3) Persist GHL sub-account fields that Better Auth's createOrganization
        //    doesn't accept — written as a follow-up update so the org definitely exists.
        const ghlFields = {
            ownerFirstName: dto.ownerFirstName,
            ownerLastName: dto.ownerLastName,
            businessEmail: dto.businessEmail ?? dto.ownerEmail,
            contactPhone: dto.contactPhone ?? null,
            website: dto.website ?? null,
            businessType: dto.businessType ?? null,
            address: dto.address ?? null,
            city: dto.city ?? null,
            state: dto.state ?? null,
            postalCode: dto.postalCode ?? null,
            country: dto.country ?? "US",
            timezone: dto.timezone ?? null,
            ghlAllowDuplicateContact: dto.ghlAllowDuplicateContact ?? false,
            ghlAllowDuplicateOpportunity:
                dto.ghlAllowDuplicateOpportunity ?? false,
            ghlAllowFacebookNameMerge: dto.ghlAllowFacebookNameMerge ?? false,
            ghlDisableContactTimezone: dto.ghlDisableContactTimezone ?? false,
        };
        const hasGhlFields = Object.values(ghlFields).some(
            (v) => v !== null && v !== false && v !== "US"
        );
        if (hasGhlFields) {
            await this.prisma.organization
                .update({ where: { slug: dto.slug }, data: ghlFields })
                .catch(() => undefined); // best-effort; don't fail the whole request
        }

        const org = await this.prisma.organization.findUnique({
            where: { slug: dto.slug },
            include: orgWithOwner,
        });
        if (!org)
            throw new InternalServerErrorException("Agent creation failed");
        return this.toAdminAgent(org);
    }

    /**
     * Admin-only: edit an agent's profile (owner identity + org/business/GHL
     * fields). Owner name/email are written to the Better Auth User; everything
     * else to the Organization. Slug and login-email uniqueness are enforced.
     */
    async updateAgent(id: string, dto: UpdateAgentDto) {
        const org = await this.assertExists(id);

        // Slug must stay unique across agents (it drives the platform subdomain).
        if (dto.slug !== org.slug) {
            const clash = await this.prisma.organization.findUnique({
                where: { slug: dto.slug },
            });
            if (clash && clash.id !== id) {
                throw new ConflictException("Slug already in use");
            }
        }

        // The owner user receives the name/email edits.
        const ownerMember = await this.prisma.member.findFirst({
            where: { organizationId: id, role: "owner" },
            orderBy: { createdAt: "asc" },
        });
        if (ownerMember) {
            const owner = await this.prisma.user.findUnique({
                where: { id: ownerMember.userId },
            });
            if (owner && owner.email !== dto.ownerEmail) {
                const emailClash = await this.prisma.user.findUnique({
                    where: { email: dto.ownerEmail },
                });
                if (emailClash && emailClash.id !== owner.id) {
                    throw new ConflictException("Email already in use");
                }
            }
        }

        const fullName = `${dto.ownerFirstName} ${dto.ownerLastName}`.trim();

        await this.prisma.$transaction(async (tx) => {
            await tx.organization.update({
                where: { id },
                data: {
                    name: dto.name,
                    slug: dto.slug,
                    ownerFirstName: dto.ownerFirstName,
                    ownerLastName: dto.ownerLastName,
                    // Blank business email → null so the UI falls back to the login email.
                    businessEmail: dto.businessEmail || null,
                    contactPhone: dto.contactPhone || null,
                    website: dto.website || null,
                    businessType: dto.businessType || null,
                    address: dto.address || null,
                    city: dto.city || null,
                    state: dto.state || null,
                    postalCode: dto.postalCode || null,
                    country: dto.country || "US",
                    timezone: dto.timezone || null,
                    ghlAllowDuplicateContact:
                        dto.ghlAllowDuplicateContact ?? false,
                    ghlAllowDuplicateOpportunity:
                        dto.ghlAllowDuplicateOpportunity ?? false,
                    ghlAllowFacebookNameMerge:
                        dto.ghlAllowFacebookNameMerge ?? false,
                    ghlDisableContactTimezone:
                        dto.ghlDisableContactTimezone ?? false,
                },
            });
            if (ownerMember) {
                await tx.user.update({
                    where: { id: ownerMember.userId },
                    data: { name: fullName, email: dto.ownerEmail },
                });
            }
        });

        const updated = await this.prisma.organization.findUnique({
            where: { id },
            include: orgWithOwner,
        });
        if (!updated)
            throw new InternalServerErrorException("Agent update failed");
        return this.toAdminAgent(updated);
    }

    async updateBranding(id: string, dto: UpdateBrandingDto) {
        await this.assertExists(id);
        // `theme` is a structured object on the wire but stored JSON-serialized.
        const { theme, ...rest } = dto;
        const org = await this.prisma.organization.update({
            where: { id },
            data: {
                ...rest,
                ...(theme !== undefined
                    ? { theme: JSON.stringify(theme) }
                    : {}),
            },
            include: orgWithOwner,
        });
        return this.toAdminAgent(org);
    }

    async setServiceStatus(id: string, serviceStatus: "active" | "suspended") {
        await this.assertExists(id);
        const org = await this.prisma.organization.update({
            where: { id },
            data: { serviceStatus },
            include: orgWithOwner,
        });
        return this.toAdminAgent(org);
    }

    /**
     * Admin-only: permanently delete an agent and everything tied to it.
     *  - Cloudflare custom hostname (if any) is removed first.
     *  - The organization is deleted, cascading its members + invitations.
     *  - Each former member's login user is deleted too (cascading their
     *    sessions + accounts) — UNLESS they're a platform admin or still belong
     *    to another agent. This leaves nothing orphaned behind a deleted agent.
     * The default platform agent is protected (its site is the marketing-site
     * fallback) and cannot be deleted.
     */
    async deleteAgent(id: string) {
        const org = await this.assertExists(id);

        const defaultSlug =
            process.env.DEFAULT_AGENT_SLUG ?? "national-house-search";
        if (org.slug === defaultSlug) {
            throw new BadRequestException(
                "The default platform agent cannot be deleted"
            );
        }

        // Candidate login users to clean up once the org is gone.
        const members = await this.prisma.member.findMany({
            where: { organizationId: id },
            select: { userId: true },
        });
        const userIds = [...new Set(members.map((m) => m.userId))];

        // External cleanup first — if Cloudflare rejects, we abort before
        // touching the database so nothing is half-deleted.
        if (org.customDomain) {
            await this.cloudflare.removeHostname(org.customDomain);
        }

        await this.prisma.$transaction(async (tx) => {
            // Cascades members + invitations.
            await tx.organization.delete({ where: { id } });

            // Remove each former member's login unless it's platform staff
            // (owner/admin) or still attached to another agent. Cascades
            // sessions + accounts.
            for (const userId of userIds) {
                const user = await tx.user.findUnique({
                    where: { id: userId },
                    select: { role: true },
                });
                if (
                    !user ||
                    user.role === PLATFORM_OWNER_ROLE ||
                    user.role === PLATFORM_ADMIN_ROLE
                ) {
                    continue;
                }
                const stillMember = await tx.member.count({
                    where: { userId },
                });
                if (stillMember > 0) continue;
                await tx.user.delete({ where: { id: userId } });
            }
        });

        return { id, deleted: true };
    }

    // ── Custom domains (Cloudflare for SaaS) ───────────────────────────────────

    async setDomain(id: string, domain: string) {
        await this.assertExists(id);
        const clash = await this.prisma.organization.findUnique({
            where: { customDomain: domain },
        });
        if (clash && clash.id !== id) {
            throw new ConflictException(
                "Domain already in use by another agent"
            );
        }

        const result = await this.cloudflare.addHostname(domain);
        await this.prisma.organization.update({
            where: { id },
            data: { customDomain: domain, domainStatus: result.status },
        });
        return result;
    }

    async refreshDomainStatus(id: string) {
        const org = await this.assertExists(id);
        if (!org.customDomain) {
            throw new BadRequestException("Agent has no custom domain");
        }
        const status = await this.cloudflare.getHostnameStatus(
            org.customDomain
        );
        await this.prisma.organization.update({
            where: { id },
            data: { domainStatus: status },
        });
        return { domain: org.customDomain, domainStatus: status };
    }

    async removeDomain(id: string) {
        const org = await this.assertExists(id);
        if (org.customDomain) {
            await this.cloudflare.removeHostname(org.customDomain);
        }
        await this.prisma.organization.update({
            where: { id },
            data: { customDomain: null, domainStatus: null },
        });
    }

    // ── Authorization helpers ──────────────────────────────────────────────────

    /** True if the user owns/admins the given org (used alongside platform admin). */
    async isOrgManager(userId: string, orgId: string): Promise<boolean> {
        const member = await this.prisma.member.findFirst({
            where: {
                userId,
                organizationId: orgId,
                role: { in: ["owner", "admin"] },
            },
        });
        return Boolean(member);
    }

    private async assertExists(id: string) {
        const org = await this.prisma.organization.findUnique({
            where: { id },
        });
        if (!org) throw new NotFoundException("Agent not found");
        return org;
    }

    // ── Mappers ────────────────────────────────────────────────────────────────

    private toAdminAgent(org: OrgWithOwner) {
        const owner = org.members?.[0]?.user;
        return {
            id: org.id,
            name: org.name,
            slug: org.slug,
            logo: org.logo,
            brandColor: org.brandColor,
            theme: parseTheme(org.theme),
            siteName: org.siteName,
            contactPhone: org.contactPhone,
            footerText: org.footerText,
            ghlScheduleEmbed: org.ghlScheduleEmbed,
            serviceStatus: org.serviceStatus,
            subdomain: agentSubdomain(org.slug),
            customDomain: org.customDomain,
            domainStatus: org.domainStatus,
            ownerName: owner?.name ?? null,
            ownerEmail: owner?.email ?? null,
            createdAt: org.createdAt,
            // GHL sub-account fields
            ownerFirstName: org.ownerFirstName,
            ownerLastName: org.ownerLastName,
            businessEmail: org.businessEmail,
            website: org.website,
            address: org.address,
            city: org.city,
            state: org.state,
            postalCode: org.postalCode,
            country: org.country,
            timezone: org.timezone,
            businessType: org.businessType,
            ghlLocationId: org.ghlLocationId,
            ghlAllowDuplicateContact: org.ghlAllowDuplicateContact,
            ghlAllowDuplicateOpportunity: org.ghlAllowDuplicateOpportunity,
            ghlAllowFacebookNameMerge: org.ghlAllowFacebookNameMerge,
            ghlDisableContactTimezone: org.ghlDisableContactTimezone,
        };
    }

    private toPublicAgent(org: BaseOrg) {
        return {
            id: org.id,
            name: org.name,
            slug: org.slug,
            logo: org.logo,
            brandColor: org.brandColor,
            theme: parseTheme(org.theme),
            siteName: org.siteName,
            contactPhone: org.contactPhone,
            footerText: org.footerText,
            ghlScheduleEmbed: org.ghlScheduleEmbed,
            serviceStatus: org.serviceStatus,
            subdomain: agentSubdomain(org.slug),
            customDomain: org.customDomain,
            domainStatus: org.domainStatus,
        };
    }
}

/** Decode the JSON-serialized theme column into an object (null if unset/invalid). */
function parseTheme(theme: string | null): unknown {
    if (!theme) return null;
    try {
        return JSON.parse(theme);
    } catch {
        return null;
    }
}

type BaseOrg = Awaited<
    ReturnType<PrismaService["organization"]["findFirstOrThrow"]>
>;
type OrgWithOwner = BaseOrg & {
    members?: { user: { name: string; email: string } | null }[];
};

/** Base domain agents get a free subdomain under, e.g. "nationalhousesearch.com". */
function subdomainBase(): string | null {
    return process.env.AGENT_SUBDOMAIN_BASE?.toLowerCase().trim() || null;
}

/** The agent's always-on public host: `{slug}.{base}` (null if base unset). */
function agentSubdomain(slug: string): string | null {
    const base = subdomainBase();
    return base ? `${slug}.${base}` : null;
}

/** Hosts under the base that must never resolve to an agent by slug. */
const RESERVED_SUBDOMAINS = new Set([
    "www",
    "app",
    "api",
    "cdn",
    "admin",
    "dashboard",
    "mail",
    "static",
    "assets",
    "customers",
]);

/** Lowercase, strip port + leading www. */
function normalizeHost(host: string | undefined): string | null {
    if (!host) return null;
    const h = host
        .split(":")[0]
        ?.toLowerCase()
        .replace(/^www\./, "");
    return h || null;
}
