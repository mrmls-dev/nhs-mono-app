"use client";

import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Building2 } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@workspace/ui/components/switch";
import { Skeleton } from "@workspace/ui/components/skeleton";
import {
    Empty,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
    EmptyDescription,
} from "@workspace/ui/components/empty";
import {
    getManagedCommunities,
    setHiddenCommunities,
    type ManagedCommunity,
} from "@/api/agent";

/**
 * Enable/disable the communities available to an agent (those in its assigned
 * counties). A community is visible on the agent's public site unless turned
 * off here. Used by the agent's own dashboard and the admin per-agent coverage
 * page — both target the same `/agents/:id/communities` endpoints.
 */
export function CommunityVisibility({ agentId }: { agentId: string }) {
    const qc = useQueryClient();
    const queryKey = ["agent-communities", agentId];

    const { data, isPending, isError } = useQuery<ManagedCommunity[]>({
        queryKey,
        queryFn: () => getManagedCommunities(agentId),
    });

    const mutation = useMutation({
        mutationFn: (hiddenIds: string[]) =>
            setHiddenCommunities(agentId, hiddenIds),
        // Optimistically flip the toggle so it feels instant.
        onMutate: async (hiddenIds: string[]) => {
            await qc.cancelQueries({ queryKey });
            const previous = qc.getQueryData<ManagedCommunity[]>(queryKey);
            if (previous) {
                const hiddenSet = new Set(hiddenIds);
                qc.setQueryData<ManagedCommunity[]>(
                    queryKey,
                    previous.map((c) => ({ ...c, hidden: hiddenSet.has(c.id) })),
                );
            }
            return { previous };
        },
        onError: (err: Error, _vars, ctx) => {
            if (ctx?.previous) qc.setQueryData(queryKey, ctx.previous);
            toast.error(err.message);
        },
        onSuccess: (fresh) => qc.setQueryData(queryKey, fresh),
    });

    // Group communities by county for display.
    const byCounty = useMemo(() => {
        const groups = new Map<string, ManagedCommunity[]>();
        for (const c of data ?? []) {
            const list = groups.get(c.county.name) ?? [];
            list.push(c);
            groups.set(c.county.name, list);
        }
        return [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    }, [data]);

    const toggle = (community: ManagedCommunity, enabled: boolean) => {
        const current = (data ?? [])
            .filter((c) => c.hidden)
            .map((c) => c.id);
        const next = enabled
            ? current.filter((id) => id !== community.id) // enabling → unhide
            : [...current, community.id]; // disabling → hide
        mutation.mutate(next);
    };

    if (isPending) {
        return (
            <div className="flex flex-col gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
            </div>
        );
    }

    if (isError) {
        return (
            <p className="text-sm text-destructive">
                Could not load communities. Make sure the API is running.
            </p>
        );
    }

    if (!data || data.length === 0) {
        return (
            <Empty className="border border-dashed">
                <EmptyHeader>
                    <EmptyMedia variant="icon">
                        <Building2 />
                    </EmptyMedia>
                    <EmptyTitle>No communities available</EmptyTitle>
                    <EmptyDescription>
                        No counties have been assigned yet. Once a platform admin
                        assigns service areas, the communities in those counties
                        will appear here.
                    </EmptyDescription>
                </EmptyHeader>
            </Empty>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            {byCounty.map(([countyName, communities]) => (
                <div key={countyName} className="flex flex-col gap-2">
                    <h3 className="text-sm font-semibold text-muted-foreground">
                        {countyName}
                    </h3>
                    <div className="overflow-hidden rounded-lg border">
                        {communities.map((c, i) => (
                            <div
                                key={c.id}
                                className={`flex items-center justify-between gap-4 px-4 py-3 ${
                                    i < communities.length - 1 ? "border-b" : ""
                                }`}
                            >
                                <div className="flex flex-col">
                                    <span className="font-medium">{c.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {c.hidden ? "Hidden" : "Visible"} on your
                                        site
                                    </span>
                                </div>
                                <Switch
                                    checked={!c.hidden}
                                    onCheckedChange={(checked) =>
                                        toggle(c, checked)
                                    }
                                    disabled={mutation.isPending}
                                    aria-label={`Toggle ${c.name}`}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
