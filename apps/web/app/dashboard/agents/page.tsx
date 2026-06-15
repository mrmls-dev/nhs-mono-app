import type { Metadata } from "next";
import { AgentsClient } from "./_components/AgentsClient";

export const metadata: Metadata = {
    title: "Agents | Dashboard",
};

export default function AgentsPage() {
    return <AgentsClient />;
}
