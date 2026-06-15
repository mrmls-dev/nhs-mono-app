import type { Metadata } from "next";
import { DomainClient } from "./_components/DomainClient";

export const metadata: Metadata = {
    title: "Domain | Dashboard",
};

export default function DomainPage() {
    return <DomainClient />;
}
