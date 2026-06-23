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
/**
 * `pending` — DNS records still need to be added/verified.
 * `provisioning` — verified; Vercel is issuing the SSL certificate (a few minutes).
 * `active` — certificate issued, domain serving HTTPS.
 */
export type DomainStatus = "pending" | "provisioning" | "active";

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

/**
 * Public-site view (no owner PII). `mapboxToken` is the agent's domain-restricted
 * Mapbox token, set ONLY when the request resolved by custom domain; on
 * subdomain/apex sites it's null and maps fall back to the shared client token.
 */
export type PublicAgent = Omit<
    Agent,
    "ownerName" | "ownerEmail" | "createdAt"
> & { mapboxToken: string | null };

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
 * members, invitations, the owner's login, its Vercel custom domain, and its
 * Mapbox token).
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

/** Per-custom-domain Mapbox token state (null = not minted yet). */
export type MapboxTokenStatus = "active" | "failed";

export type DomainSetup = {
    domain: string;
    status: DomainStatus;
    dnsInstructions: { type: string; name: string; value: string }[];
    /** Map token for this domain: "active" = ready, "failed" = mint failed. */
    mapboxTokenStatus: MapboxTokenStatus | null;
};

/**
 * Live DNS setup for the agent's custom domain, with Vercel as the source of
 * truth: the routing record (A for apex, CNAME for subdomain) plus any unique
 * TXT ownership challenge Vercel currently requires. Fetch when the domain
 * panel opens; the TXT disappears once Vercel marks the domain verified.
 */
export async function getDomainSetup(id: string): Promise<DomainSetup> {
    const res = await fetch(`${API_BASE}/agents/${id}/domain`, {
        ...authed,
        cache: "no-store",
    });
    if (!res.ok) await parseError(res, "Failed to load domain setup");
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

// ── Coverage: assigned counties + community visibility ───────────────────────

/** A county assigned to an agent (region included for grouping). */
export type AssignedCounty = {
    id: string;
    name: string;
    slug: string;
    region: { id: string; name: string };
};

/** A community available to an agent, with its on/off (hidden) state. */
export type ManagedCommunity = {
    id: string;
    name: string;
    slug: string;
    status: "NOW_SELLING" | "COMING_SOON" | "SOLD_OUT";
    image: string;
    countyId: string;
    county: { id: string; name: string };
    hidden: boolean;
};

/** Platform staff: the counties assigned to an agent. */
export async function getAssignedCounties(
    agentId: string,
): Promise<AssignedCounty[]> {
    const res = await fetch(`${API_BASE}/agents/${agentId}/counties`, {
        ...authed,
        cache: "no-store",
    });
    if (!res.ok) await parseError(res, "Failed to load assigned counties");
    return res.json();
}

/** Platform staff: replace the agent's assigned counties. */
export async function setAssignedCounties(
    agentId: string,
    countyIds: string[],
): Promise<AssignedCounty[]> {
    const res = await fetch(`${API_BASE}/agents/${agentId}/counties`, {
        ...authed,
        method: "PUT",
        headers: jsonHeaders,
        body: JSON.stringify({ countyIds }),
    });
    if (!res.ok) await parseError(res, "Failed to save assigned counties");
    return res.json();
}

/** Staff or agent owner: communities in assigned counties + their hidden flag. */
export async function getManagedCommunities(
    agentId: string,
): Promise<ManagedCommunity[]> {
    const res = await fetch(`${API_BASE}/agents/${agentId}/communities`, {
        ...authed,
        cache: "no-store",
    });
    if (!res.ok) await parseError(res, "Failed to load communities");
    return res.json();
}

/** Staff or agent owner: replace the hidden (disabled) community set. */
export async function setHiddenCommunities(
    agentId: string,
    communityIds: string[],
): Promise<ManagedCommunity[]> {
    const res = await fetch(`${API_BASE}/agents/${agentId}/communities/hidden`, {
        ...authed,
        method: "PUT",
        headers: jsonHeaders,
        body: JSON.stringify({ communityIds }),
    });
    if (!res.ok) await parseError(res, "Failed to save community visibility");
    return res.json();
}

/** A floor plan the agent can give a custom video, with its default + override. */
export type AgentFloorPlanVideo = {
    floorPlanId: string;
    floorPlanName: string;
    communityId: string;
    communityName: string;
    /** The platform default video (admin-set on the floor plan). */
    defaultVideo: string | null;
    /** The agent's override (null = falls back to the default). */
    videoUrl: string | null;
};

/** Staff or agent owner: floor plans across the agent's communities + videos. */
export async function getFloorPlanVideos(
    agentId: string,
): Promise<AgentFloorPlanVideo[]> {
    const res = await fetch(`${API_BASE}/agents/${agentId}/floor-plan-videos`, {
        ...authed,
        cache: "no-store",
    });
    if (!res.ok) await parseError(res, "Failed to load model videos");
    return res.json();
}

/**
 * Staff or agent owner: set the agent's custom video for a floor plan, or pass
 * an empty string to clear it (revert to the floor plan's default video).
 */
export async function setFloorPlanVideo(
    agentId: string,
    floorPlanId: string,
    videoUrl: string,
): Promise<{ floorPlanId: string; videoUrl: string | null }> {
    const res = await fetch(
        `${API_BASE}/agents/${agentId}/floor-plan-videos/${floorPlanId}`,
        {
            ...authed,
            method: "PUT",
            headers: jsonHeaders,
            // Omit videoUrl entirely when clearing so it passes @IsOptional.
            body: JSON.stringify(videoUrl ? { videoUrl } : {}),
        },
    );
    if (!res.ok) await parseError(res, "Failed to save model video");
    return res.json();
}
