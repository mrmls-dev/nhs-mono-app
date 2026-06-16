const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export type FloorPlanMediaInput = {
    src: string;
    alt: string;
    caption?: string;
};

/** Shape sent to create/update a floor plan (mirrors the API DTO). */
export type FloorPlanInput = {
    slug: string;
    name: string;
    brand?: string;
    startingPrice: number;
    beds: number;
    baths: number;
    garage: number;
    stories: number;
    sqft: number;
    image: string;
    modelVideo?: string;
    description?: string;
    diagramImage?: string;
    gallery: FloorPlanMediaInput[];
};

export type FloorPlanDetail = {
    id: string;
    slug: string;
    name: string;
    brand?: string | null;
    startingPrice: number;
    beds: number;
    baths: number;
    garage: number;
    stories: number;
    sqft: number;
    image: string;
    modelVideo?: string | null;
    description?: string | null;
    diagramImage?: string | null;
    community: { id: string; slug: string; name: string };
    gallery: {
        src: string;
        alt: string;
        caption?: string | null;
    }[];
};

async function readError(res: Response, fallback: string): Promise<never> {
    const body = await res.json().catch(() => null);
    const msg = body?.message;
    throw new Error(Array.isArray(msg) ? msg.join(", ") : (msg ?? fallback));
}

export async function getFloorPlan(
    communitySlug: string,
    planSlug: string,
): Promise<FloorPlanDetail | null> {
    const res = await fetch(
        `${API_BASE}/communities/${communitySlug}/plans/${planSlug}`,
        { cache: "no-store" },
    );
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("Failed to fetch floor plan");
    return res.json();
}

export async function createFloorPlan(
    communitySlug: string,
    input: FloorPlanInput,
): Promise<FloorPlanDetail> {
    const res = await fetch(`${API_BASE}/communities/${communitySlug}/plans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(input),
    });
    if (!res.ok) await readError(res, "Failed to create floor plan");
    return res.json();
}

export async function updateFloorPlan(
    id: string,
    input: Partial<FloorPlanInput>,
): Promise<FloorPlanDetail> {
    const res = await fetch(`${API_BASE}/plans/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(input),
    });
    if (!res.ok) await readError(res, "Failed to update floor plan");
    return res.json();
}

export async function deleteFloorPlan(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/plans/${id}`, {
        method: "DELETE",
        credentials: "include",
    });
    if (!res.ok) await readError(res, "Failed to delete floor plan");
}
