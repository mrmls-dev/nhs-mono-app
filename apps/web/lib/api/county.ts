const API_BASE =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export type County = {
    id: string;
    name: string;
    slug: string;
    boundsNorth: number;
    boundsSouth: number;
    boundsEast: number;
    boundsWest: number;
    region: { id: string; name: string };
};

export type CreateCountyInput = {
    name: string;
    slug: string;
    regionId: string;
    boundsNorth: number;
    boundsSouth: number;
    boundsEast: number;
    boundsWest: number;
};

export type UpdateCountyInput = Partial<CreateCountyInput>;

export type CountyCommunity = {
    id: string;
    name: string;
    slug: string;
    status: "NOW_SELLING" | "COMING_SOON" | "SOLD_OUT";
    image: string;
    priceFrom: number;
    _count: { floorPlans: number };
};

export type CountyDetail = {
    id: string;
    name: string;
    slug: string;
    boundsNorth: number;
    boundsSouth: number;
    boundsEast: number;
    boundsWest: number;
    region: { id: string; name: string; slug: string };
    communities: CountyCommunity[];
};

export async function getCounties(): Promise<County[]> {
    const res = await fetch(`${API_BASE}/counties`, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch counties");
    return res.json();
}

/** Public, agent-scoped: only the agent's assigned counties (empty when none). */
export async function getPublicCounties(agentId: string): Promise<County[]> {
    const res = await fetch(
        `${API_BASE}/counties?agentId=${encodeURIComponent(agentId)}`,
        { cache: "no-store" },
    );
    if (!res.ok) throw new Error("Failed to fetch counties");
    return res.json();
}

export async function getCounty(slug: string): Promise<CountyDetail | null> {
    const res = await fetch(`${API_BASE}/counties/${slug}`, {
        cache: "no-store",
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("Failed to fetch county");
    return res.json();
}

export async function updateCounty(
    id: string,
    input: UpdateCountyInput,
): Promise<County> {
    const res = await fetch(`${API_BASE}/counties/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(input),
    });
    if (!res.ok) {
        const body = await res.json().catch(() => null);
        const msg = body?.message;
        throw new Error(
            Array.isArray(msg) ? msg.join(", ") : (msg ?? "Failed to update county"),
        );
    }
    return res.json();
}

export async function deleteCounty(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/counties/${id}`, {
        method: "DELETE",
        credentials: "include",
    });
    if (!res.ok) {
        const body = await res.json().catch(() => null);
        const msg = body?.message;
        throw new Error(
            Array.isArray(msg) ? msg.join(", ") : (msg ?? "Failed to delete county"),
        );
    }
}

export async function createCounty(input: CreateCountyInput): Promise<County> {
    const res = await fetch(`${API_BASE}/counties`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(input),
    });
    if (!res.ok) {
        const body = await res.json().catch(() => null);
        const msg = body?.message;
        throw new Error(
            Array.isArray(msg) ? msg.join(", ") : (msg ?? "Failed to create county"),
        );
    }
    return res.json();
}
