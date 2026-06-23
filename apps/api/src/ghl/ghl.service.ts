import {
    BadGatewayException,
    Injectable,
    Logger,
    ServiceUnavailableException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CryptoService } from "../common/crypto";

/** A contact as we consume it from GHL's search API. */
export type GhlContact = {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phone: string | null;
    tags: string[];
};

/** Resolved credentials for a GHL request. */
type GhlCreds = { token: string; locationId: string };

/** GHL API v2 base + version pin (LeadConnector). */
const GHL_BASE = "https://services.leadconnectorhq.com";
const GHL_VERSION = "2021-07-28";
/** Page size for the search API + a hard cap so a bad cursor can't loop forever. */
const PAGE_LIMIT = 100;
const MAX_PAGES = 100;

/**
 * Thin client for OUR single GHL location, authenticated with a Private
 * Integration Token (Bearer). Used by the internal marketing-contacts feature
 * to pull engaged contacts and push phone-number edits back.
 *
 * Credentials are read from the `GhlIntegration` row (managed from the
 * platform Integrations page; token decrypted via {@link CryptoService}),
 * falling back to `GHL_API_TOKEN` / `GHL_LOCATION_ID` env vars when no row
 * exists. When neither is present, calls surface a clear "GHL not configured"
 * error instead of issuing unauthenticated requests.
 */
@Injectable()
export class GhlService {
    private readonly logger = new Logger(GhlService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly crypto: CryptoService
    ) {}

    /** Whether usable credentials exist (DB row or env fallback). */
    async isConfigured(): Promise<boolean> {
        return (await this.tryResolveCreds()) !== null;
    }

    /** Resolve credentials, throwing if GHL isn't configured. */
    private async resolveCreds(): Promise<GhlCreds> {
        const creds = await this.tryResolveCreds();
        if (!creds) {
            throw new ServiceUnavailableException(
                "GoHighLevel is not connected. Add a token on the Integrations page."
            );
        }
        return creds;
    }

    private async tryResolveCreds(): Promise<GhlCreds | null> {
        const row = await this.prisma.ghlIntegration.findUnique({
            where: { id: "ghl" },
        });
        if (row) {
            return {
                token: this.crypto.decrypt(row.tokenCipher),
                locationId: row.locationId,
            };
        }
        // Env fallback (legacy / local dev).
        const token = process.env.GHL_API_TOKEN;
        const locationId = process.env.GHL_LOCATION_ID;
        return token && locationId ? { token, locationId } : null;
    }

    /**
     * Validate a candidate token + location id with a minimal live call.
     * Throws (BadGateway) if GHL rejects them; used by the Integrations save flow.
     */
    async verify(token: string, locationId: string): Promise<void> {
        await this.request(
            "/contacts/search",
            "POST",
            { locationId, pageLimit: 1 },
            { token, locationId }
        );
    }

    /**
     * All contacts in our location carrying any of the given tags. We query one
     * tag at a time (each paginated) and de-duplicate by contact id — simpler
     * and more robust than nested OR-group filters, and the engaged set is small.
     *
     * NOTE: verify the `tags`/`contains` filter operator against the live
     * Search Contacts docs if GHL changes the schema.
     */
    async searchContactsByTags(tags: string[]): Promise<GhlContact[]> {
        const creds = await this.resolveCreds();
        const byId = new Map<string, GhlContact>();
        for (const tag of tags) {
            for (const contact of await this.searchByTag(tag, creds)) {
                byId.set(contact.id, contact);
            }
        }
        return [...byId.values()];
    }

    private async searchByTag(
        tag: string,
        creds: GhlCreds
    ): Promise<GhlContact[]> {
        const collected: GhlContact[] = [];
        let searchAfter: unknown[] | undefined;

        for (let page = 0; page < MAX_PAGES; page++) {
            const body: Record<string, unknown> = {
                locationId: creds.locationId,
                pageLimit: PAGE_LIMIT,
                filters: [{ field: "tags", operator: "contains", value: tag }],
            };
            if (searchAfter) body.searchAfter = searchAfter;

            const res = await this.request<GhlSearchResponse>(
                "/contacts/search",
                "POST",
                body,
                creds
            );
            const batch = res.contacts ?? [];
            for (const c of batch) collected.push(toGhlContact(c));

            // Cursor for the next page is the last row's `searchAfter`.
            const last = batch[batch.length - 1];
            if (batch.length < PAGE_LIMIT || !last?.searchAfter) break;
            searchAfter = last.searchAfter;
        }

        return collected;
    }

    /** Update a single contact's phone number in GHL. */
    async updateContactPhone(contactId: string, phone: string): Promise<void> {
        const creds = await this.resolveCreds();
        await this.request(`/contacts/${contactId}`, "PUT", { phone }, creds);
    }

    private async request<T>(
        path: string,
        method: "POST" | "PUT",
        body: unknown,
        creds: GhlCreds
    ): Promise<T> {
        const res = await fetch(`${GHL_BASE}${path}`, {
            method,
            headers: {
                Authorization: `Bearer ${creds.token}`,
                Version: GHL_VERSION,
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });
        const json = (await res.json().catch(() => ({}))) as T & {
            message?: string | string[];
        };
        if (!res.ok) {
            const msg = Array.isArray(json.message)
                ? json.message.join(", ")
                : json.message;
            this.logger.error(
                `GHL ${method} ${path} failed (${res.status}): ${msg ?? "unknown error"}`
            );
            throw new BadGatewayException(msg ?? "GHL API request failed");
        }
        return json;
    }
}

/** Raw search-response contact shape (subset we read). */
type GhlSearchContact = {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    phone?: string | null;
    tags?: string[] | null;
    /** Opaque cursor GHL returns per row for keyset pagination. */
    searchAfter?: unknown[];
};

type GhlSearchResponse = {
    contacts?: GhlSearchContact[];
    total?: number;
};

function toGhlContact(c: GhlSearchContact): GhlContact {
    return {
        id: c.id,
        firstName: c.firstName ?? null,
        lastName: c.lastName ?? null,
        email: c.email ?? null,
        phone: c.phone ?? null,
        tags: c.tags ?? [],
    };
}
