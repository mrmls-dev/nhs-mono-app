"use client";

import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getMyAgent } from "@/api/agent";
import { BrandingForm } from "./BrandingForm";

function Loading() {
    return (
        <div className="flex items-center justify-center rounded-lg border border-dashed py-16 text-sm text-muted-foreground">
            <Loader2 className="mr-2 size-4 animate-spin" />
            Loading…
        </div>
    );
}

/**
 * Agent-facing branding page. Platform admins edit agent branding from the
 * per-agent detail page (`/dashboard/agents/[id]/branding`) instead.
 */
export function BrandingClient() {
    const { data: agent, isLoading } = useQuery({
        queryKey: ["my-agent"],
        queryFn: getMyAgent,
    });

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-semibold tracking-tight">
                    Branding
                </h1>
                <p className="text-sm text-muted-foreground">
                    Customize how your site looks to visitors.
                </p>
            </div>
            {isLoading || !agent ? <Loading /> : <BrandingForm agent={agent} />}
        </div>
    );
}
