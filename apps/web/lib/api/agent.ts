/**
 * Agent (white-label organization) API client. Mirrors the NestJS
 * `apps/api/src/agent` endpoints. Authenticated calls send the Better Auth
 * session cookie via `credentials: "include"`.
 */

import type { ThemeConfig } from "@/lib/theme";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
// Server components (e.g. marketing layout) may use an internal URL.
const SERVER_API_BASE =
    process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? API_BASE;

export type ServiceStatus = "active" | "suspended";
export type DomainStatus = "pending" | "active";

/** Full agent record (admin/owner view). */
export type Agent = {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    brandColor: string | null;
    theme: ThemeConfig | null;
    siteName: string | null;
    seoTitle: string | null;
    titleSuffix: string | null;
    metaDescription: string | null;
    contactPhone: string | null;
    footerText: string | null;
    ghlScheduleEmbed: string | null;
    serviceStatus: ServiceStatus;
    /** Always-on platform subdomain `{slug}.{base}` (null if base unconfigured). */
    subdomain: string | null;
    customDomain: string | null;
    domainStatus: DomainStatus | null;
    ownerName: string | null;
    ownerEmail: string | null;
    createdAt: string;
    // GHL sub-account fields
    ownerFirstName: string | null;
    ownerLastName: string | null;
    businessEmail: string | null;
    website: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    postalCode: string | null;
    country: string | null;
    timezone: string | null;
    businessType: string | null;
    ghlLocationId: string | null;
    ghlAllowDuplicateContact: boolean;
    ghlAllowDuplicateOpportunity: boolean;
    ghlAllowFacebookNameMerge: boolean;
    ghlDisableContactTimezone: boolean;
};

/** Public-site view (no owner PII). */
export type PublicAgent = Omit<Agent, "ownerName" | "ownerEmail" | "createdAt">;

export type CreateAgentInput = {
    // Owner
    ownerFirstName: string;
    ownerLastName: string;
    ownerEmail: string;
    password: string;
    // Organization
    name: string;
    slug: string;
    // GHL business info
    businessEmail?: string;
    contactPhone?: string;
    website?: string;
    businessType?: string;
    // Address
    address?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    timezone?: string;
    // GHL settings
    ghlAllowDuplicateContact?: boolean;
    ghlAllowDuplicateOpportunity?: boolean;
    ghlAllowFacebookNameMerge?: boolean;
    ghlDisableContactTimezone?: boolean;
};

/** Admin: edit an agent's profile (everything from create except the password). */
export type UpdateAgentInput = Omit<CreateAgentInput, "password">;

export type UpdateBrandingInput = {
    logo?: string;
    brandColor?: string;
    theme?: ThemeConfig;
    siteName?: string;
    seoTitle?: string;
    titleSuffix?: string;
    metaDescription?: string;
    contactPhone?: string;
    footerText?: string;
    ghlScheduleEmbed?: string;
};

export type DomainResult = {
    id: string | null;
    hostname: string;
    status: DomainStatus;
    dnsInstructions: { type: string; name: string; value: string }[];
};

async function parseError(res: Response, fallback: string): Promise<never> {
    const body = await res.json().catch(() => null);
    const msg = body?.message;
    throw new Error(
        Array.isArray(msg) ? msg.join(", ") : (msg ?? fallback),
    );
}

const authed: RequestInit = { credentials: "include" };
const jsonHeaders = { "Content-Type": "application/json" };

// ── Reads ──────────────────────────────────────────────────────────────────

/** Admin: list every agent. */
export async function getAgents(): Promise<Agent[]> {
    const res = await fetch(`${API_BASE}/agents`, {
        ...authed,
        cache: "no-store",
    });
    if (!res.ok) await parseError(res, "Failed to load agents");
    return res.json();
}

/** Agent: my own org. */
export async function getMyAgent(): Promise<Agent> {
    const res = await fetch(`${API_BASE}/agents/me`, {
        ...authed,
        cache: "no-store",
    });
    if (!res.ok) await parseError(res, "Failed to load your agent");
    return res.json();
}

/** Public: resolve the agent for a marketing-site request by Host. */
export async function getAgentByDomain(
    host: string | undefined,
): Promise<PublicAgent> {
    const qs = host ? `?host=${encodeURIComponent(host)}` : "";
    const res = await fetch(`${SERVER_API_BASE}/agents/by-domain${qs}`, {
        cache: "no-store",
    });
    if (!res.ok) await parseError(res, "Failed to resolve agent");
    return res.json();
}

// ── Writes ─────────────────────────────────────────────────────────────────

export async function createAgent(input: CreateAgentInput): Promise<Agent> {
    const res = await fetch(`${API_BASE}/agents`, {
        ...authed,
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify(input),
    });
    if (!res.ok) await parseError(res, "Failed to create agent");
    return res.json();
}

/** Admin: edit an agent's profile. */
export async function updateAgent(
    id: string,
    input: UpdateAgentInput,
): Promise<Agent> {
    const res = await fetch(`${API_BASE}/agents/${id}`, {
        ...authed,
        method: "PATCH",
        headers: jsonHeaders,
        body: JSON.stringify(input),
    });
    if (!res.ok) await parseError(res, "Failed to update agent");
    return res.json();
}

/**
 * Admin: permanently delete an agent and everything tied to it (organization,
 * members, invitations, the owner's login, and any Cloudflare custom hostname).
 */
export async function deleteAgent(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/agents/${id}`, {
        ...authed,
        method: "DELETE",
    });
    if (!res.ok) await parseError(res, "Failed to delete agent");
}

export async function updateBranding(
    id: string,
    input: UpdateBrandingInput,
): Promise<Agent> {
    const res = await fetch(`${API_BASE}/agents/${id}/branding`, {
        ...authed,
        method: "PATCH",
        headers: jsonHeaders,
        body: JSON.stringify(input),
    });
    if (!res.ok) await parseError(res, "Failed to save branding");
    return res.json();
}

export async function setServiceStatus(
    id: string,
    serviceStatus: ServiceStatus,
): Promise<Agent> {
    const res = await fetch(`${API_BASE}/agents/${id}/service-status`, {
        ...authed,
        method: "PATCH",
        headers: jsonHeaders,
        body: JSON.stringify({ serviceStatus }),
    });
    if (!res.ok) await parseError(res, "Failed to update service status");
    return res.json();
}

export async function setDomain(
    id: string,
    domain: string,
): Promise<DomainResult> {
    const res = await fetch(`${API_BASE}/agents/${id}/domain`, {
        ...authed,
        method: "PATCH",
        headers: jsonHeaders,
        body: JSON.stringify({ domain }),
    });
    if (!res.ok) await parseError(res, "Failed to set domain");
    return res.json();
}

export async function refreshDomainStatus(
    id: string,
): Promise<{ domain: string; domainStatus: DomainStatus }> {
    const res = await fetch(`${API_BASE}/agents/${id}/domain/status`, {
        ...authed,
        cache: "no-store",
    });
    if (!res.ok) await parseError(res, "Failed to check domain status");
    return res.json();
}

export async function removeDomain(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/agents/${id}/domain`, {
        ...authed,
        method: "DELETE",
    });
    if (!res.ok) await parseError(res, "Failed to remove domain");
}
