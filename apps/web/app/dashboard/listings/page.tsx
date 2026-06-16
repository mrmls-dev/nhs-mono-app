import type { Metadata } from "next";
import { ListingsClient } from "./_components/ListingsClient";

export const metadata: Metadata = {
    title: "Communities | Dashboard",
};

export default function ListingsPage() {
    return <ListingsClient />;
}
