/**
 * Platform integrations API client. Mirrors `apps/api/src/integrations`.
 * Platform-staff only. The GHL token is write-only — it is sent on save but
 * never returned by the API.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export type GhlIntegrationStatus = {
    configured: boolean;
    source: "saved" | "env" | "none";
    locationId: string | null;
    tokenLast4: string | null;
    status: string | null;
    lastError: string | null;
    lastVerifiedAt: string | null;
};

export type SaveGhlIntegrationInput = {
    locationId: string;
    /** Omit/empty to keep the stored token (when editing only the location). */
    apiToken?: string;
};

async function parseError(res: Response, fallback: string): Promise<never> {
    const body = await res.json().catch(() => null);
    const msg = body?.message;
    throw new Error(Array.isArray(msg) ? msg.join(", ") : (msg ?? fallback));
}

const authed: RequestInit = { credentials: "include" };
const jsonHeaders = { "Content-Type": "application/json" };

/** Current GHL connection status (never includes the token). */
export async function getGhlIntegration(): Promise<GhlIntegrationStatus> {
    const res = await fetch(`${API_BASE}/integrations/ghl`, {
        ...authed,
        cache: "no-store",
    });
    if (!res.ok) await parseError(res, "Failed to load integration");
    return res.json();
}

/** Save + verify the GHL token / location. */
export async function saveGhlIntegration(
    input: SaveGhlIntegrationInput,
): Promise<GhlIntegrationStatus> {
    const res = await fetch(`${API_BASE}/integrations/ghl`, {
        ...authed,
        method: "PUT",
        headers: jsonHeaders,
        body: JSON.stringify(input),
    });
    if (!res.ok) await parseError(res, "Failed to save integration");
    return res.json();
}
