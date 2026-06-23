import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CryptoService } from "../common/crypto";
import { GhlService } from "../ghl/ghl.service";
import type { UpdateGhlIntegrationDto } from "./dto/update-ghl-integration.dto";

const GHL_ROW_ID = "ghl";

/** Safe, token-free view of the GHL connection for the dashboard. */
export type GhlIntegrationStatus = {
    /** True once a token is stored (DB row) or provided via env fallback. */
    configured: boolean;
    /** Where the active credentials come from. */
    source: "saved" | "env" | "none";
    locationId: string | null;
    /** Masked tail of the saved token, e.g. "1234" → shown as "••••1234". */
    tokenLast4: string | null;
    status: string | null; // "connected" | "error"
    lastError: string | null;
    lastVerifiedAt: Date | null;
};

@Injectable()
export class IntegrationsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly crypto: CryptoService,
        private readonly ghl: GhlService
    ) {}

    /** Current connection status — never includes the token itself. */
    async getGhlStatus(): Promise<GhlIntegrationStatus> {
        const row = await this.prisma.ghlIntegration.findUnique({
            where: { id: GHL_ROW_ID },
        });
        if (row) {
            return {
                configured: true,
                source: "saved",
                locationId: row.locationId,
                tokenLast4: row.tokenLast4,
                status: row.status,
                lastError: row.lastError,
                lastVerifiedAt: row.lastVerifiedAt,
            };
        }

        // No saved row — report the env fallback if present.
        const envConfigured = Boolean(
            process.env.GHL_API_TOKEN && process.env.GHL_LOCATION_ID
        );
        return {
            configured: envConfigured,
            source: envConfigured ? "env" : "none",
            locationId: envConfigured
                ? (process.env.GHL_LOCATION_ID ?? null)
                : null,
            tokenLast4: null,
            status: null,
            lastError: null,
            lastVerifiedAt: null,
        };
    }

    /**
     * Save the GHL connection. Resolves the effective token (the new one, or the
     * stored one when editing only the location), verifies it live against GHL,
     * and persists it encrypted **only if verification succeeds** — so a bad
     * token can't overwrite a working one.
     */
    async saveGhl(
        dto: UpdateGhlIntegrationDto,
        userId: string
    ): Promise<GhlIntegrationStatus> {
        const existing = await this.prisma.ghlIntegration.findUnique({
            where: { id: GHL_ROW_ID },
        });

        const newToken = dto.apiToken?.trim();
        const token =
            newToken || (existing && this.crypto.decrypt(existing.tokenCipher));
        if (!token) {
            throw new BadRequestException(
                "An API token is required to connect GoHighLevel."
            );
        }

        // Verify before persisting; reject (and keep the old config) on failure.
        try {
            await this.ghl.verify(token, dto.locationId);
        } catch (err) {
            const reason =
                err instanceof Error ? err.message : "Verification failed";
            throw new BadRequestException(
                `GoHighLevel rejected these credentials: ${reason}`
            );
        }

        const data = {
            locationId: dto.locationId,
            tokenCipher: this.crypto.encrypt(token),
            tokenLast4: token.slice(-4),
            status: "connected",
            lastError: null,
            lastVerifiedAt: new Date(),
            updatedById: userId,
        };

        await this.prisma.ghlIntegration.upsert({
            where: { id: GHL_ROW_ID },
            create: { id: GHL_ROW_ID, ...data },
            update: data,
        });

        return this.getGhlStatus();
    }
}
