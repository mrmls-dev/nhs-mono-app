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

export async function getCounties(): Promise<County[]> {
    const res = await fetch(`${API_BASE}/counties`, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch counties");
    return res.json();
}

export async function deleteCounty(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/counties/${id}`, { method: "DELETE" });
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
