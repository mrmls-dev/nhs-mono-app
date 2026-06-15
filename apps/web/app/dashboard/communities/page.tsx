import type { Metadata } from "next";
import { CommunitiesClient } from "./_components/CommunitiesClient";

export const metadata: Metadata = {
    title: "Communities | Dashboard",
};

export default function CommunitiesPage() {
    return <CommunitiesClient />;
}
