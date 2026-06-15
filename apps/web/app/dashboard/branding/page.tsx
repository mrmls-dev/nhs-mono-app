import type { Metadata } from "next";
import { BrandingClient } from "./_components/BrandingClient";

export const metadata: Metadata = {
    title: "Branding | Dashboard",
};

export default function BrandingPage() {
    return <BrandingClient />;
}
