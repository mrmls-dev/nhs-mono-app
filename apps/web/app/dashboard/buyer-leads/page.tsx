import type { Metadata } from "next";
import { BuyerLeadsClient } from "./_components/BuyerLeadsClient";

export const metadata: Metadata = {
    title: "Buyer Leads | Dashboard",
};

export default function BuyerLeadsPage() {
    return <BuyerLeadsClient />;
}
