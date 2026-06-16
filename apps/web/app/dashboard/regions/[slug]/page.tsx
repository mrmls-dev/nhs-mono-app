import type { Metadata } from "next";
import { RegionDetailClient } from "./_components/RegionDetailClient";

export const metadata: Metadata = {
    title: "Region | Dashboard",
};

export default async function RegionDetailPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    return <RegionDetailClient slug={slug} />;
}
