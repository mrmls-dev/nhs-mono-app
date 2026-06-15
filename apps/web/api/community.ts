import type { CommunityFormOutput } from "@/app/dashboard/communities/new/community-schema";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export type CommunityListItem = {
    id: string;
    slug: string;
    name: string;
    status: "NOW_SELLING" | "COMING_SOON" | "SOLD_OUT";
    location: string;
    image: string;
    priceFrom: number;
    homesForSale: number;
    bedsMin: number;
    bedsMax: number;
    bathsMin: number;
    bathsMax: number;
    garageMin: number;
    garageMax: number;
    storiesMin: number;
    storiesMax: number;
    sqftFrom: number;
    lat: number;
    lng: number;
    countyId: string;
    county: { id: string; name: string };
    _count: { floorPlans: number };
};

export type FloorPlanMedia = {
    type: "IMAGE" | "VIDEO";
    src: string;
    alt: string;
    caption?: string | null;
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
    gallery: FloorPlanMedia[];
};

export type FullCommunity = {
    id: string;
    slug: string;
    name: string;
    brand?: string | null;
    location: string;
    image: string;
    status: "NOW_SELLING" | "COMING_SOON" | "SOLD_OUT";
    homesForSale: number;
    bedsMin: number;
    bedsMax: number;
    bathsMin: number;
    bathsMax: number;
    garageMin: number;
    garageMax: number;
    storiesMin: number;
    storiesMax: number;
    sqftFrom: number;
    priceFrom: number;
    lat: number;
    lng: number;
    about: string;
    county: { id: string; name: string };
    amenities: { amenity: { name: string } }[];
    schools: { name: string; type: string; grades: string; distance: string }[];
    floorPlans: FloorPlanDetail[];
};

export async function getCommunities(): Promise<CommunityListItem[]> {
    const res = await fetch(`${API_BASE}/communities`, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch communities");
    return res.json();
}

export async function getCommunity(slug: string): Promise<FullCommunity | null> {
    const res = await fetch(`${API_BASE}/communities/${slug}`, {
        cache: "no-store",
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("Failed to fetch community");
    return res.json();
}

export async function deleteCommunity(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/communities/${id}`, {
        method: "DELETE",
    });
    if (!res.ok) {
        const body = await res.json().catch(() => null);
        const msg = body?.message;
        throw new Error(
            Array.isArray(msg)
                ? msg.join(", ")
                : (msg ?? "Failed to delete community"),
        );
    }
}

export async function createCommunity(input: CommunityFormOutput) {
    const res = await fetch(`${API_BASE}/communities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
    });
    if (!res.ok) {
        const body = await res.json().catch(() => null);
        const msg = body?.message;
        throw new Error(
            Array.isArray(msg)
                ? msg.join(", ")
                : (msg ?? "Failed to create community"),
        );
    }
    return res.json();
}
