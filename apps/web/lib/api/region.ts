const API_BASE =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export type Region = {
    id: string;
    name: string;
    slug: string;
    state: string;
    _count: { counties: number };
};

export type CreateRegionInput = {
    name: string;
    slug: string;
    state?: string;
};

export async function getRegions(): Promise<Region[]> {
    const res = await fetch(`${API_BASE}/regions`, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch regions");
    return res.json();
}

export async function deleteRegion(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/regions/${id}`, { method: "DELETE" });
    if (!res.ok) {
        const body = await res.json().catch(() => null);
        const msg = body?.message;
        throw new Error(
            Array.isArray(msg) ? msg.join(", ") : (msg ?? "Failed to delete region"),
        );
    }
}

export async function createRegion(input: CreateRegionInput): Promise<Region> {
    const res = await fetch(`${API_BASE}/regions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
    });
    if (!res.ok) {
        const body = await res.json().catch(() => null);
        const msg = body?.message;
        throw new Error(
            Array.isArray(msg) ? msg.join(", ") : (msg ?? "Failed to create region"),
        );
    }
    return res.json();
}
