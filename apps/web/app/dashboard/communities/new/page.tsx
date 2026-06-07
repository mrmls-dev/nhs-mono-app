import type { Metadata } from "next";
import regionsData from "@/data/regions.json";
import { CommunityForm } from "./CommunityForm";

export const metadata: Metadata = {
    title: "Add Community | Dashboard",
};

export default function NewCommunityPage() {
    // Flatten the region → county hierarchy for the county selector.
    const counties = regionsData.regions.flatMap((region) =>
        region.counties.map((county) => ({
            id: county.id,
            name: county.name,
            region: region.name,
        })),
    );

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
