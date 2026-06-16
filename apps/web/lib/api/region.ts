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

export type UpdateRegionInput = Partial<CreateRegionInput>;

export type RegionCounty = {
    id: string;
    name: string;
    slug: string;
    _count: { communities: number };
};

export type RegionDetail = {
    id: string;
    name: string;
    slug: string;
    state: string;
    counties: RegionCounty[];
};

export async function getRegions(): Promise<Region[]> {
    const res = await fetch(`${API_BASE}/regions`, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch regions");
    return res.json();
}

export async function getRegion(slug: string): Promise<RegionDetail | null> {
    const res = await fetch(`${API_BASE}/regions/${slug}`, {
        cache: "no-store",
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("Failed to fetch region");
    return res.json();
}

export async function updateRegion(
    id: string,
    input: UpdateRegionInput,
): Promise<Region> {
    const res = await fetch(`${API_BASE}/regions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(input),
    });
    if (!res.ok) {
        const body = await res.json().catch(() => null);
        const msg = body?.message;
        throw new Error(
            Array.isArray(msg) ? msg.join(", ") : (msg ?? "Failed to update region"),
        );
    }
    return res.json();
}

export async function deleteRegion(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/regions/${id}`, {
        method: "DELETE",
        credentials: "include",
    });
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
        credentials: "include",
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
