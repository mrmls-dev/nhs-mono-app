/**
 * Internal marketing-contacts API client. Mirrors the NestJS
 * `apps/api/src/marketing-contacts` endpoints. Platform-staff only; every call
 * sends the Better Auth session cookie via `credentials: "include"`.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export const LEAD_STATUSES = [
    "NEW",
    "ATTEMPTING",
    "CONTACTED",
    "CONVERTED",
    "NOT_INTERESTED",
    "DO_NOT_CALL",
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LAST_OUTREACHES = [
    "NONE",
    "COLD_CALL",
    "VOICEMAIL",
    "TEXT",
] as const;
export type LastOutreach = (typeof LAST_OUTREACHES)[number];

/** Human labels for the dropdowns / badges. */
export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
    NEW: "New",
    ATTEMPTING: "Attempting",
    CONTACTED: "Contacted",
    CONVERTED: "Converted",
    NOT_INTERESTED: "Not interested",
    DO_NOT_CALL: "Do not call",
};

export const LAST_OUTREACH_LABELS: Record<LastOutreach, string> = {
    NONE: "None",
    COLD_CALL: "Cold call",
    VOICEMAIL: "Voicemail",
    TEXT: "Text",
};

export type MarketingContact = {
    id: string;
    ghlContactId: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phone: string | null;
    tags: string[];
    leadStatus: LeadStatus;
    lastOutreach: LastOutreach;
    note: string | null;
    phoneSyncedAt: string | null;
    phoneSyncError: string | null;
    lastFetchedAt: string | null;
    createdAt: string;
    updatedAt: string;
};

export type SyncResult = { created: number; updated: number; total: number };

export type PaginatedContacts = {
    data: MarketingContact[];
    total: number;
    page: number;
    pageSize: number;
};

export type ListContactsParams = {
    page?: number;
    pageSize?: number;
    q?: string;
    status?: LeadStatus;
};

export type UpdateMarketingContactInput = {
    phone?: string;
    leadStatus?: LeadStatus;
    lastOutreach?: LastOutreach;
    note?: string;
};

async function parseError(res: Response, fallback: string): Promise<never> {
    const body = await res.json().catch(() => null);
    const msg = body?.message;
    throw new Error(Array.isArray(msg) ? msg.join(", ") : (msg ?? fallback));
}

const authed: RequestInit = { credentials: "include" };
const jsonHeaders = { "Content-Type": "application/json" };

/** Paginated contacts (newest first) with optional search + status filter. */
export async function getMarketingContacts(
    params: ListContactsParams = {},
): Promise<PaginatedContacts> {
    const qs = new URLSearchParams();
    if (params.page) qs.set("page", String(params.page));
    if (params.pageSize) qs.set("pageSize", String(params.pageSize));
    if (params.q?.trim()) qs.set("q", params.q.trim());
    if (params.status) qs.set("status", params.status);

    const res = await fetch(`${API_BASE}/marketing-contacts?${qs}`, {
        ...authed,
        cache: "no-store",
    });
    if (!res.ok) await parseError(res, "Failed to load contacts");
    return res.json();
}

/** Pull the latest engaged contacts from GHL and upsert them. */
export async function syncMarketingContacts(): Promise<SyncResult> {
    const res = await fetch(`${API_BASE}/marketing-contacts/sync`, {
        ...authed,
        method: "POST",
    });
    if (!res.ok) await parseError(res, "Failed to fetch from GHL");
    return res.json();
}

/** Edit a contact's phone (pushed to GHL) / status / outreach / note. */
export async function updateMarketingContact(
    id: string,
    input: UpdateMarketingContactInput,
): Promise<MarketingContact> {
    const res = await fetch(`${API_BASE}/marketing-contacts/${id}`, {
        ...authed,
        method: "PATCH",
        headers: jsonHeaders,
        body: JSON.stringify(input),
    });
    if (!res.ok) await parseError(res, "Failed to save contact");
    return res.json();
}
