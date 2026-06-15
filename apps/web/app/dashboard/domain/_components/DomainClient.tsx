"use client";

import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getMyAgent } from "@/api/agent";
import { DomainEditor } from "../../_components/DomainEditor";

function Loading() {
    return (
        <div className="flex items-center justify-center rounded-lg border border-dashed py-16 text-sm text-muted-foreground">
            <Loader2 className="mr-2 size-4 animate-spin" />
            Loading…
        </div>
    );
}

/**
 * Agent-facing domain page. Platform admins manage agent domains from the
 * per-agent detail page (`/dashboard/agents/[id]/domain`) instead.
 */
export function DomainClient() {
    const { data: agent, isLoading } = useQuery({
        queryKey: ["my-agent"],
        queryFn: getMyAgent,
    });

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-semibold tracking-tight">Domain</h1>
                <p className="text-sm text-muted-foreground">
                    Connect a custom domain to your site.
                </p>
            </div>

            {isLoading || !agent ? (
                <Loading />
            ) : (
                <DomainEditor key={agent.id} agent={agent} />
            )}
        </div>
    );
}
