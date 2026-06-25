const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export type OverviewStats = {
    communities: number;
    regions: number;
    counties: number;
    floorPlans: number;
};

export async function getOverviewStats(): Promise<OverviewStats> {
    const res = await fetch(`${API_BASE}/stats/overview`, {
        cache: "no-store",
        credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch overview stats");
    return res.json();
}
