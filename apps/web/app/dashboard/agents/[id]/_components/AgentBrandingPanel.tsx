"use client";

import { Loader2 } from "lucide-react";
import { BrandingForm } from "../../../branding/_components/BrandingForm";
import { useAgent } from "./use-agent";

export function AgentBrandingPanel({ agentId }: { agentId: string }) {
    const { agent, isLoading } = useAgent(agentId);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center rounded-lg border border-dashed py-16 text-sm text-muted-foreground">
                <Loader2 className="mr-2 size-4 animate-spin" />
                Loading…
            </div>
        );
    }
    if (!agent) {
        return (
            <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">
                Agent not found.
            </div>
        );
    }

    return <BrandingForm key={agent.id} agent={agent} />;
}
