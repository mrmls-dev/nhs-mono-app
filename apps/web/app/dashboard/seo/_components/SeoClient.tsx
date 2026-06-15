"use client";

import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getMyAgent } from "@/api/agent";
import { SeoForm } from "./SeoForm";

function Loading() {
    return (
        <div className="flex items-center justify-center rounded-lg border border-dashed py-16 text-sm text-muted-foreground">
            <Loader2 className="mr-2 size-4 animate-spin" />
            Loading…
        </div>
    );
}

/**
 * Agent-facing SEO page. Platform admins edit agent SEO from the per-agent
 * detail page (`/dashboard/agents/[id]/seo`) instead.
 */
export function SeoClient() {
    const { data: agent, isLoading } = useQuery({
        queryKey: ["my-agent"],
        queryFn: getMyAgent,
    });

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-semibold tracking-tight">SEO</h1>
                <p className="text-sm text-muted-foreground">
                    Control how your site appears in search results and social
                    shares.
                </p>
            </div>
            {isLoading || !agent ? <Loading /> : <SeoForm agent={agent} />}
        </div>
    );
}
