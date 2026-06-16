import type { Metadata } from "next";
import { CountyDetailClient } from "./_components/CountyDetailClient";

export const metadata: Metadata = {
    title: "County | Dashboard",
};

export default async function CountyDetailPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    return <CountyDetailClient slug={slug} />;
}
