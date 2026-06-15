import type { Metadata } from "next";
import { CountiesClient } from "./_components/CountiesClient";

export const metadata: Metadata = {
    title: "Counties | Dashboard",
};

export default function CountiesPage() {
    return <CountiesClient />;
}
