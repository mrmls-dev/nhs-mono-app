import type { Metadata } from "next";
import { RegionsClient } from "./_components/RegionsClient";

export const metadata: Metadata = {
    title: "Regions | Dashboard",
};

export default function RegionsPage() {
    return <RegionsClient />;
}
