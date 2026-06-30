import type { LeadStatus } from "./marketing-contacts";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export type CreateBuyerLeadInput = {
    /** Organization id of the agent whose site produced this lead. */
    agentId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    consent: boolean;
    location?: string;
    countyId?: string | null;
    homeType?: string | null;
    bedrooms?: string | null;
    bathrooms?: string | null;
    budget?: string | null;
    matchCount?: number;
};

/** Persist a buyer-match survey submission (public endpoint, agent-attributed). */
export async function createBuyerLead(
    input: CreateBuyerLeadInput,
): Promise<{ id: string }> {
    const res = await fetch(`${API_BASE}/buyer-leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
    });
    if (!res.ok) {
        let message = "Failed to submit your details";
        try {
            const body = await res.json();
            message = Array.isArray(body?.message)
                ? body.message.join(", ")
                : (body?.message ?? message);
        } catch {
            // non-JSON error body — keep the default message
        }
        throw new Error(message);
    }
    return res.json();
}

// ─── Dashboard read/manage (authenticated) ───────────────────────────────────

/** A buyer lead as returned to the dashboard. `organization` is included only
 *  for platform staff (so the Agent column can show which site it came from). */
export type BuyerLead = {
    id: string;
    organizationId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    consent: boolean;
    location: string | null;
    countyId: string | null;
    homeType: string | null;
    bedrooms: string | null;
    bathrooms: string | null;
    budget: string | null;
    matchCount: number | null;
    leadStatus: LeadStatus;
    note: string | null;
    createdAt: string;
    updatedAt: string;
    organization?: { id: string; name: string };
};

export type PaginatedLeads = {
    data: BuyerLead[];
    total: number;
    page: number;
    pageSize: number;
};

export type ListLeadsParams = {
    page?: number;
    pageSize?: number;
    q?: string;
    /** Admin-only: narrow to a single agent's org. */
    agentId?: string;
};

export type UpdateBuyerLeadInput = {
    leadStatus?: LeadStatus;
    note?: string;
};

async function parseError(res: Response, fallback: string): Promise<never> {
    const body = await res.json().catch(() => null);
    const msg = body?.message;
    throw new Error(Array.isArray(msg) ? msg.join(", ") : (msg ?? fallback));
}

const authed: RequestInit = { credentials: "include" };

/** Paginated leads (newest first), scoped to the caller's org (or all for staff). */
export async function getBuyerLeads(
    params: ListLeadsParams = {},
): Promise<PaginatedLeads> {
    const qs = new URLSearchParams();
    if (params.page) qs.set("page", String(params.page));
    if (params.pageSize) qs.set("pageSize", String(params.pageSize));
    if (params.q?.trim()) qs.set("q", params.q.trim());
    if (params.agentId) qs.set("agentId", params.agentId);

    const res = await fetch(`${API_BASE}/buyer-leads?${qs}`, {
        ...authed,
        cache: "no-store",
    });
    if (!res.ok) await parseError(res, "Failed to load buyer leads");
    return res.json();
}

/** Edit a lead's status / note. */
export async function updateBuyerLead(
    id: string,
    input: UpdateBuyerLeadInput,
): Promise<BuyerLead> {
    const res = await fetch(`${API_BASE}/buyer-leads/${id}`, {
        ...authed,
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
    });
    if (!res.ok) await parseError(res, "Failed to save lead");
    return res.json();
}
