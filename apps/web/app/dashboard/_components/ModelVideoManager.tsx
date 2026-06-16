"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, Loader2, Video } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Skeleton } from "@workspace/ui/components/skeleton";
import {
    Empty,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
    EmptyDescription,
} from "@workspace/ui/components/empty";
import {
    getFloorPlanVideos,
    setFloorPlanVideo,
    type AgentFloorPlanVideo,
} from "@/api/agent";

/**
 * Replace the model video for any floor plan in an agent's communities with a
 * custom URL. Used by the agent's own dashboard and the admin per-agent coverage
 * page (platform staff can set an agent's videos too — same `assertManager`
 * endpoints). Communities are collapsible; each model has a URL field. Clearing
 * the field reverts to the platform default video.
 */
export function ModelVideoManager({ agentId }: { agentId: string }) {
    const qc = useQueryClient();
    const queryKey = ["agent-floor-plan-videos", agentId];

    const { data, isPending, isError } = useQuery<AgentFloorPlanVideo[]>({
        queryKey,
        queryFn: () => getFloorPlanVideos(agentId),
    });

    // Local draft of each plan's URL field, seeded from the server data.
    const [drafts, setDrafts] = useState<Record<string, string>>({});
    useEffect(() => {
        if (data) {
            setDrafts(
                Object.fromEntries(
                    data.map((p) => [p.floorPlanId, p.videoUrl ?? ""]),
                ),
            );
        }
    }, [data]);

    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    const [savingId, setSavingId] = useState<string | null>(null);

    const mutation = useMutation({
        mutationFn: ({ planId, url }: { planId: string; url: string }) =>
            setFloorPlanVideo(agentId, planId, url),
        onMutate: ({ planId }) => setSavingId(planId),
        onSuccess: (_res, { url }) => {
            qc.invalidateQueries({ queryKey });
            toast.success(url ? "Model video saved." : "Reverted to default.");
        },
        onError: (err: Error) => toast.error(err.message),
        onSettled: () => setSavingId(null),
    });

    // Group plans by community for the collapsible list.
    const byCommunity = useMemo(() => {
        const groups = new Map<
            string,
            { name: string; plans: AgentFloorPlanVideo[] }
        >();
        for (const p of data ?? []) {
            const g = groups.get(p.communityId) ?? {
                name: p.communityName,
                plans: [],
            };
            g.plans.push(p);
            groups.set(p.communityId, g);
        }
        return [...groups.entries()].sort((a, b) =>
            a[1].name.localeCompare(b[1].name),
        );
    }, [data]);

    if (isPending) {
        return (
            <div className="flex flex-col gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
            </div>
        );
    }

    if (isError) {
        return (
            <p className="text-sm text-destructive">
                Could not load model videos. Make sure the API is running.
            </p>
        );
    }

    if (!data || data.length === 0) {
        return (
            <Empty className="border border-dashed">
                <EmptyHeader>
                    <EmptyMedia variant="icon">
                        <Video />
                    </EmptyMedia>
                    <EmptyTitle>No models available</EmptyTitle>
                    <EmptyDescription>
                        Once you have communities with floor plans in your
                        service areas, you can set a custom video for each model
                        here.
                    </EmptyDescription>
                </EmptyHeader>
            </Empty>
        );
    }

    const toggle = (id: string) =>
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });

    return (
        <div className="flex flex-col gap-3">
            {byCommunity.map(([communityId, group]) => {
                const isOpen = expanded.has(communityId);
                const overrideCount = group.plans.filter(
                    (p) => p.videoUrl,
                ).length;
                return (
                    <div
                        key={communityId}
                        className="overflow-hidden rounded-lg border"
                    >
                        <button
                            type="button"
                            onClick={() => toggle(communityId)}
                            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted/50"
                        >
                            <span className="flex items-center gap-2 font-medium">
                                {isOpen ? (
                                    <ChevronDown className="size-4 text-muted-foreground" />
                                ) : (
                                    <ChevronRight className="size-4 text-muted-foreground" />
                                )}
                                {group.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {group.plans.length}{" "}
                                {group.plans.length === 1 ? "model" : "models"}
                                {overrideCount > 0 &&
                                    ` · ${overrideCount} custom`}
                            </span>
                        </button>

                        {isOpen && (
                            <div className="flex flex-col gap-4 border-t px-4 py-4">
                                {group.plans.map((p) => {
                                    const value = drafts[p.floorPlanId] ?? "";
                                    const saving = savingId === p.floorPlanId;
                                    const dirty =
                                        value !== (p.videoUrl ?? "");
                                    return (
                                        <div
                                            key={p.floorPlanId}
                                            className="flex flex-col gap-1.5"
                                        >
                                            <label className="text-sm font-medium">
                                                {p.floorPlanName}
                                            </label>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Input
                                                    value={value}
                                                    placeholder={
                                                        p.defaultVideo
                                                            ? `Default: ${p.defaultVideo}`
                                                            : "https://youtu.be/…"
                                                    }
                                                    onChange={(e) =>
                                                        setDrafts((d) => ({
                                                            ...d,
                                                            [p.floorPlanId]:
                                                                e.target.value,
                                                        }))
                                                    }
                                                    className="min-w-[16rem] flex-1"
                                                />
                                                <Button
                                                    size="sm"
                                                    disabled={!dirty || saving}
                                                    onClick={() =>
                                                        mutation.mutate({
                                                            planId: p.floorPlanId,
                                                            url: value.trim(),
                                                        })
                                                    }
                                                >
                                                    {saving && (
                                                        <Loader2
                                                            data-icon="inline-start"
                                                            className="animate-spin"
                                                        />
                                                    )}
                                                    Save
                                                </Button>
                                                {p.videoUrl && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        disabled={saving}
                                                        onClick={() =>
                                                            mutation.mutate({
                                                                planId: p.floorPlanId,
                                                                url: "",
                                                            })
                                                        }
                                                    >
                                                        Reset
                                                    </Button>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                {p.videoUrl
                                                    ? "Showing your custom video on your site."
                                                    : p.defaultVideo
                                                      ? "Using the default video. Paste a URL to override."
                                                      : "No default video. Paste a URL to add one."}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
