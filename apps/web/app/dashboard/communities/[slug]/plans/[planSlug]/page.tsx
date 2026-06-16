import type { Metadata } from "next";
import { FloorPlanDetailClient } from "./_components/FloorPlanDetailClient";

export const metadata: Metadata = {
    title: "Floor Plan | Dashboard",
};

export default async function FloorPlanDetailPage({
    params,
}: {
    params: Promise<{ slug: string; planSlug: string }>;
}) {
    const { slug, planSlug } = await params;
    return <FloorPlanDetailClient communitySlug={slug} planSlug={planSlug} />;
}
