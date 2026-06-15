import type { Metadata } from "next";
import { CommunityForm } from "./CommunityForm";

export const metadata: Metadata = {
    title: "Add Community | Dashboard",
};

type County = { id: string; name: string; region: { name: string } };

async function getCounties(): Promise<{ id: string; name: string; region: string }[]> {
    const apiUrl = process.env.API_URL ?? "http://localhost:3001";
    const res = await fetch(`${apiUrl}/counties`, { cache: "no-store" });
    if (!res.ok) return [];
    const counties: County[] = await res.json();
    return counties.map((c) => ({ id: c.id, name: c.name, region: c.region.name }));
}

export default async function NewCommunityPage() {
    const counties = await getCounties();

    return (
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-semibold tracking-tight">
                    Add Community
                </h1>
                <p className="text-sm text-muted-foreground">
                    Create a new community with its gallery, amenities, schools,
                    and floor plans.
                </p>
            </div>

            <CommunityForm counties={counties} />
        </div>
    );
}
