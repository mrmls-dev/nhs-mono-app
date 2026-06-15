import type { Metadata } from "next";
import Link from "next/link";
import { SquarePen } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { AgentDetailsClient } from "../_components/AgentDetailsClient";

export const metadata: Metadata = {
    title: "Agent Details | Dashboard",
};

export default async function AgentDetailsPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-2xl font-semibold tracking-tight">
                    Agent details
                </h1>
                <Button asChild variant="outline">
                    <Link href={`/dashboard/agents/${id}/edit`}>
                        <SquarePen data-icon="inline-start" />
                        Edit
                    </Link>
                </Button>
            </div>
            <AgentDetailsClient agentId={id} />
        </div>
    );
}
