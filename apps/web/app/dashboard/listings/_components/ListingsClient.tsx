"use client";

import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getMyAgent } from "@/api/agent";
import { CommunityVisibility } from "../../_components/CommunityVisibility";
import { ModelVideoManager } from "../../_components/ModelVideoManager";

function Loading() {
    return (
        <div className="flex items-center justify-center rounded-lg border border-dashed py-16 text-sm text-muted-foreground">
            <Loader2 className="mr-2 size-4 animate-spin" />
            Loading…
        </div>
    );
}

/**
 * Agent-facing community visibility page. The agent enables/disables which of
 * the communities in their assigned counties show on their public site.
 */
export function ListingsClient() {
    const { data: agent, isLoading } = useQuery({
        queryKey: ["my-agent"],
        queryFn: getMyAgent,
    });

    return (
        <div className="flex flex-col gap-10">
            <section className="flex flex-col gap-6">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Communities
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Choose which communities appear on your site. Everything
                        in your service areas is shown by default — turn off any
                        you don&rsquo;t want to display.
                    </p>
                </div>
                {isLoading || !agent ? (
                    <Loading />
                ) : (
                    <CommunityVisibility agentId={agent.id} />
                )}
            </section>

            <section className="flex flex-col gap-6">
                <div className="flex flex-col gap-1">
                    <h2 className="text-lg font-semibold tracking-tight">
                        Model videos
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Replace any model&rsquo;s video with your own. Expand a
                        community and paste a URL (YouTube, Vimeo, or a direct
                        video link). Leave blank to use the default.
                    </p>
                </div>
                {isLoading || !agent ? (
                    <Loading />
                ) : (
                    <ModelVideoManager agentId={agent.id} />
                )}
            </section>
        </div>
    );
}
