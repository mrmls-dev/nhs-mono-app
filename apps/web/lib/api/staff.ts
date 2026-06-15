/**
 * Platform staff (admin-role users) API client. Mirrors the NestJS
 * `apps/api/src/staff` endpoints. Authenticated calls send the Better Auth
 * session cookie via `credentials: "include"`. Admin-only.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

/** Platform role: `owner` ("us", never deletable) or `admin` (staff member). */
export type StaffRole = "owner" | "admin";

/** A platform staff member (Better Auth user with a platform role). */
export type StaffMember = {
    id: string;
    name: string;
    email: string;
    role: StaffRole;
    createdAt: string;
};

export type CreateStaffInput = {
    name: string;
    email: string;
    password: string;
};

/** Edit a member's profile — name + email only (never the password). */
export type UpdateStaffInput = {
    name: string;
    email: string;
};

async function parseError(res: Response, fallback: string): Promise<never> {
    const body = await res.json().catch(() => null);
    const msg = body?.message;
    throw new Error(Array.isArray(msg) ? msg.join(", ") : (msg ?? fallback));
}

const authed: RequestInit = { credentials: "include" };
const jsonHeaders = { "Content-Type": "application/json" };

/** Admin: list every platform staff member. */
export async function getStaff(): Promise<StaffMember[]> {
    const res = await fetch(`${API_BASE}/staff`, {
        ...authed,
        cache: "no-store",
    });
    if (!res.ok) await parseError(res, "Failed to load members");
    return res.json();
}

/** Admin: add a platform staff member. */
export async function createStaff(
    input: CreateStaffInput,
): Promise<StaffMember> {
    const res = await fetch(`${API_BASE}/staff`, {
        ...authed,
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify(input),
    });
    if (!res.ok) await parseError(res, "Failed to add member");
    return res.json();
}

/** Admin: edit a member's name + email. */
export async function updateStaff(
    id: string,
    input: UpdateStaffInput,
): Promise<StaffMember> {
    const res = await fetch(`${API_BASE}/staff/${id}`, {
        ...authed,
        method: "PATCH",
        headers: jsonHeaders,
        body: JSON.stringify(input),
    });
    if (!res.ok) await parseError(res, "Failed to update member");
    return res.json();
}

/** Admin: delete a member (the owner and your own account are protected). */
export async function deleteStaff(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/staff/${id}`, {
        ...authed,
        method: "DELETE",
    });
    if (!res.ok) await parseError(res, "Failed to delete member");
}
