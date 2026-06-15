import type { Metadata } from "next";
import { AgentBrandingPanel } from "../_components/AgentBrandingPanel";

export const metadata: Metadata = {
    title: "Agent Branding | Dashboard",
};

export default async function AgentBrandingPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-2xl font-semibold tracking-tight">Branding</h1>
            <AgentBrandingPanel agentId={id} />
        </div>
    );
}
