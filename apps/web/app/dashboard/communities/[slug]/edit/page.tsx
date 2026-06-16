import type { Metadata } from "next";
import { EditCommunityClient } from "./_components/EditCommunityClient";

export const metadata: Metadata = {
    title: "Edit Community | Dashboard",
};

export default async function EditCommunityPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    return <EditCommunityClient slug={slug} />;
}
