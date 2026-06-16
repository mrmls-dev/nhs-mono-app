import type { Metadata } from "next";
import { CommunityDetailClient } from "./_components/CommunityDetailClient";

export const metadata: Metadata = {
    title: "Community | Dashboard",
};

export default async function CommunityDetailPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    return <CommunityDetailClient slug={slug} />;
}
