import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { Prisma } from "../../prisma/generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { GhlService } from "../ghl/ghl.service";
import type { UpdateMarketingContactDto } from "./dto/update-marketing-contact.dto";
import type { ListMarketingContactsDto } from "./dto/list-marketing-contacts.dto";

/**
 * Campaign-engagement tags we pull from GHL. These are added by the email
 * workflows; adjust here if the workflow tag spellings change.
 */
const ENGAGEMENT_TAGS = ["opened", "clicked", "replied"];

/** Contacts carrying any of these tags are never imported or shown. */
const EXCLUDED_TAGS = ["agent"];

export type SyncResult = { created: number; updated: number; total: number };

export type PaginatedContacts = {
    data: Awaited<ReturnType<PrismaService["marketingContact"]["findMany"]>>;
    total: number;
    page: number;
    pageSize: number;
};

@Injectable()
export class MarketingContactsService {
    private readonly logger = new Logger(MarketingContactsService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly ghl: GhlService
    ) {}

    /**
     * Paginated contacts, newest first, with an optional free-text search
     * (name/email/phone) + status filter. Excluded tags are filtered at the GHL
     * sync, so nothing is masked here.
     */
    async listContacts(
        params: ListMarketingContactsDto
    ): Promise<PaginatedContacts> {
        const { page, pageSize, q, status } = params;
        // Split into words so "Jane Doe" matches firstName="Jane" + lastName="Doe":
        // every token must match SOME field (AND of tokens, OR of fields).
        const tokens = q?.trim().split(/\s+/).filter(Boolean) ?? [];

        const where: Prisma.MarketingContactWhereInput = {
            ...(status ? { leadStatus: status } : {}),
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

        // Read-only list+count need no atomicity; a batch `$transaction`
        // intermittently times out (P2028) against the Neon pooler.
        const [data, total] = await Promise.all([
            this.prisma.marketingContact.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
            this.prisma.marketingContact.count({ where }),
        ]);

        return { data, total, page, pageSize };
    }

    /**
     * Pull engaged contacts from GHL and upsert by `ghlContactId`:
     *  - new contact      → create with GHL phone as the starting value.
     *  - existing contact → refresh name/email/tags only; never overwrite the
     *    team's phone/status/outreach/note. (If we have no local phone yet and
     *    GHL now has one, adopt it.)
     * This is what prevents duplicate rows on repeated fetches.
     */
    async sync(): Promise<SyncResult> {
        // The exclusion is applied in the GHL query; this filter is a safety net
        // in case GHL doesn't honor the `not_contains` operator.
        const fetched = await this.ghl.searchContactsByTags(
            ENGAGEMENT_TAGS,
            EXCLUDED_TAGS
        );
        const contacts = fetched.filter(
            (c) => !c.tags.some((t) => EXCLUDED_TAGS.includes(t))
        );
        const now = new Date();

        const existing = await this.prisma.marketingContact.findMany({
            where: { ghlContactId: { in: contacts.map((c) => c.id) } },
            select: { ghlContactId: true, phone: true },
        });
        const priorByGhlId = new Map(existing.map((e) => [e.ghlContactId, e]));

        let created = 0;
        let updated = 0;

        await Promise.all(
            contacts.map((c) => {
                const prior = priorByGhlId.get(c.id);
                if (prior) {
                    updated++;
                    return this.prisma.marketingContact.update({
                        where: { ghlContactId: c.id },
                        data: {
                            firstName: c.firstName,
                            lastName: c.lastName,
                            email: c.email,
                            tags: c.tags,
                            lastFetchedAt: now,
                            // Adopt GHL's phone only when we have none locally.
                            ...(!prior.phone && c.phone
                                ? { phone: c.phone }
                                : {}),
                        },
                    });
                }
                created++;
                return this.prisma.marketingContact.create({
                    data: {
                        ghlContactId: c.id,
                        firstName: c.firstName,
                        lastName: c.lastName,
                        email: c.email,
                        phone: c.phone,
                        tags: c.tags,
                        lastFetchedAt: now,
                    },
                });
            })
        );

        return { created, updated, total: contacts.length };
    }

    /**
     * Update a contact's call-workflow fields. When the phone number changes we
     * push that single field back to GHL: on success we stamp `phoneSyncedAt`;
     * on failure we still save the local phone but record `phoneSyncError` so the
     * UI can flag "saved locally, GHL push failed". Other fields stay local.
     */
    async update(id: string, dto: UpdateMarketingContactDto) {
        const contact = await this.prisma.marketingContact.findUnique({
            where: { id },
        });
        if (!contact) throw new NotFoundException("Contact not found");

        const data: Record<string, unknown> = {};
        if (dto.leadStatus !== undefined) data.leadStatus = dto.leadStatus;
        if (dto.lastOutreach !== undefined)
            data.lastOutreach = dto.lastOutreach;
        if (dto.note !== undefined) data.note = dto.note.trim() || null;

        if (dto.phone !== undefined) {
            const newPhone = dto.phone.trim() || null;
            const phoneChanged = newPhone !== contact.phone;
            data.phone = newPhone;

            // Only push to GHL when a non-empty number actually changed —
            // clearing a number locally shouldn't wipe it in GHL.
            if (phoneChanged && newPhone && contact.ghlContactId) {
                try {
                    await this.ghl.updateContactPhone(
                        contact.ghlContactId,
                        newPhone
                    );
                    data.phoneSyncedAt = new Date();
                    data.phoneSyncError = null;
                } catch (err) {
                    const message =
                        err instanceof Error ? err.message : "GHL push failed";
                    this.logger.error(
                        `Phone push to GHL failed for ${contact.ghlContactId}: ${message}`
                    );
                    data.phoneSyncError = message;
                }
            }
        }

        return this.prisma.marketingContact.update({ where: { id }, data });
    }
}
