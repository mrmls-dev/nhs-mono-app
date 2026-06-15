import type { Metadata } from "next";
import { AgentEditPanel } from "./_components/AgentEditPanel";

export const metadata: Metadata = {
    title: "Edit Agent | Dashboard",
};

export default async function AgentEditPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-2xl font-semibold tracking-tight">
                Edit agent
            </h1>
            <AgentEditPanel agentId={id} />
        </div>
    );
}
