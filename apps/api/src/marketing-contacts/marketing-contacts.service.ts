import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { GhlService } from "../ghl/ghl.service";
import type { UpdateMarketingContactDto } from "./dto/update-marketing-contact.dto";

/**
 * Campaign-engagement tags we pull from GHL. These are added by the email
 * workflows; adjust here if the workflow tag spellings change.
 */
const ENGAGEMENT_TAGS = ["opened", "clicked", "replied"];

export type SyncResult = { created: number; updated: number; total: number };

@Injectable()
export class MarketingContactsService {
    private readonly logger = new Logger(MarketingContactsService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly ghl: GhlService
    ) {}

    /** Every stored contact, newest first. */
    listContacts() {
        return this.prisma.marketingContact.findMany({
            orderBy: { createdAt: "desc" },
        });
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
        const contacts = await this.ghl.searchContactsByTags(ENGAGEMENT_TAGS);
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
