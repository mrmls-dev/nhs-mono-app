import type { Metadata } from "next";
import { AgentSeoPanel } from "../_components/AgentSeoPanel";

export const metadata: Metadata = {
    title: "Agent SEO | Dashboard",
};

export default async function AgentSeoPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-2xl font-semibold tracking-tight">SEO</h1>
            <AgentSeoPanel agentId={id} />
        </div>
    );
}
