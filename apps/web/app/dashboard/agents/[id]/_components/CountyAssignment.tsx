"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@workspace/ui/components/button";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { getCounties, type County } from "@/api/county";
import { getAssignedCounties, setAssignedCounties } from "@/api/agent";

/**
 * Platform-staff control: choose which counties an agent serves. Only
 * communities in the selected counties become available to that agent's site.
 */
export function CountyAssignment({ agentId }: { agentId: string }) {
    const qc = useQueryClient();

    const { data: allCounties, isPending: countiesPending } = useQuery<County[]>(
        { queryKey: ["counties"], queryFn: getCounties },
    );

    const { data: assigned, isPending: assignedPending } = useQuery({
        queryKey: ["agent-counties", agentId],
        queryFn: () => getAssignedCounties(agentId),
    });

    const [selected, setSelected] = useState<Set<string>>(new Set());

    // Seed the local selection once the assigned set loads.
    useEffect(() => {
        if (assigned) setSelected(new Set(assigned.map((c) => c.id)));
    }, [assigned]);

    const mutation = useMutation({
        mutationFn: (countyIds: string[]) =>
            setAssignedCounties(agentId, countyIds),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["agent-counties", agentId] });
            // Assigned counties drive which communities are available.
            qc.invalidateQueries({ queryKey: ["agent-communities", agentId] });
            toast.success("Service areas updated.");
        },
        onError: (err: Error) => toast.error(err.message),
    });

    // Group counties by region for display.
    const byRegion = useMemo(() => {
        const groups = new Map<string, County[]>();
        for (const c of allCounties ?? []) {
            const list = groups.get(c.region.name) ?? [];
            list.push(c);
            groups.set(c.region.name, list);
        }
        return [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    }, [allCounties]);

    const toggle = (id: string) =>
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });

    const dirty = useMemo(() => {
        const initial = new Set((assigned ?? []).map((c) => c.id));
        if (initial.size !== selected.size) return true;
        for (const id of selected) if (!initial.has(id)) return true;
        return false;
    }, [assigned, selected]);

    if (countiesPending || assignedPending) {
        return (
            <div className="flex flex-col gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full rounded-lg" />
                ))}
            </div>
        );
    }

    if (!allCounties || allCounties.length === 0) {
        return (
            <p className="text-sm text-muted-foreground">
                No counties exist yet. Add counties in the catalog first.
            </p>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-5">
                {byRegion.map(([regionName, counties]) => (
                    <fieldset key={regionName} className="flex flex-col gap-2">
                        <legend className="text-sm font-semibold text-muted-foreground">
                            {regionName}
                        </legend>
                        <div className="grid gap-2 sm:grid-cols-2">
                            {counties.map((c) => (
                                <label
                                    key={c.id}
                                    className="flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer hover:bg-muted/50"
                                >
                                    <Checkbox
                                        checked={selected.has(c.id)}
                                        onCheckedChange={() => toggle(c.id)}
                                    />
                                    <span className="font-medium">{c.name}</span>
                                </label>
                            ))}
                        </div>
                    </fieldset>
                ))}
            </div>

            <div className="flex justify-end">
                <Button
                    disabled={!dirty || mutation.isPending}
                    onClick={() => mutation.mutate([...selected])}
                >
                    {mutation.isPending && (
                        <Loader2
                            data-icon="inline-start"
                            className="animate-spin"
                        />
                    )}
                    Save service areas
                </Button>
            </div>
        </div>
    );
}
