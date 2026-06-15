import type { Metadata } from "next";
import { AgentDomainPanel } from "../_components/AgentDomainPanel";

export const metadata: Metadata = {
    title: "Agent Domain | Dashboard",
};

export default async function AgentDomainPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-2xl font-semibold tracking-tight">Domain</h1>
            <AgentDomainPanel agentId={id} />
        </div>
    );
}
