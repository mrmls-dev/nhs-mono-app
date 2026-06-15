import type { Metadata } from "next";
import { SeoClient } from "./_components/SeoClient";

export const metadata: Metadata = {
    title: "SEO | Dashboard",
};

export default function SeoPage() {
    return <SeoClient />;
}
