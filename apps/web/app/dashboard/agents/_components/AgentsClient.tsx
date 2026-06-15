"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Loader2, Users, Trash2, SquarePen } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import { Switch } from "@workspace/ui/components/switch";
import {
    Empty,
    EmptyContent,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
    EmptyDescription,
} from "@workspace/ui/components/empty";
import {
    getAgents,
    setServiceStatus,
    type Agent,
    type ServiceStatus,
} from "@/api/agent";
import {
    DomainStatusBadge,
    ServiceStatusBadge,
} from "../../_components/StatusChips";
import { DeleteAgentDialog } from "./DeleteAgentDialog";

export function AgentsClient() {
    const router = useRouter();
    const queryClient = useQueryClient();

    const { data: agents = [], isLoading } = useQuery({
        queryKey: ["agents"],
        queryFn: getAgents,
    });

    const serviceMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: ServiceStatus }) =>
            setServiceStatus(id, status),
        onSuccess: (updated) => {
            queryClient.invalidateQueries({ queryKey: ["agents"] });
            toast.success(
                `${updated.name} service ${
                    updated.serviceStatus === "active" ? "restored" : "suspended"
                }.`,
            );
        },
        onError: (err: Error) => toast.error(err.message),
    });

    const activeCount = useMemo(
        () => agents.filter((a) => a.serviceStatus === "active").length,
        [agents],
    );

    const toggleService = (agent: Agent) => {
        serviceMutation.mutate({
            id: agent.id,
            status: agent.serviceStatus === "active" ? "suspended" : "active",
        });
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Agents
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {agents.length} agent{agents.length === 1 ? "" : "s"} ·{" "}
                        {activeCount} active
                    </p>
                </div>
                <Button asChild>
                    <Link href="/dashboard/agents/new">
                        <Plus data-icon="inline-start" />
                        Add Agent
                    </Link>
                </Button>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center rounded-lg border border-dashed py-16 text-sm text-muted-foreground">
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Loading agents…
                </div>
            ) : agents.length > 0 ? (
                <div className="overflow-hidden rounded-lg border">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-muted/50 text-left text-muted-foreground">
                                <th className="px-4 py-3 font-medium">
                                    Organization
                                </th>
                                <th className="px-4 py-3 font-medium hidden md:table-cell">
                                    Owner
                                </th>
                                <th className="px-4 py-3 font-medium hidden lg:table-cell">
                                    Domain
                                </th>
                                <th className="px-4 py-3 font-medium">
                                    Status
                                </th>
                                <th className="px-4 py-3 font-medium text-right">
                                    Service
                                </th>
                                <th className="px-4 py-3 font-medium text-right">
                                    <span className="sr-only">Actions</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {agents.map((a, i) => (
                                <tr
                                    key={a.id}
                                    onClick={() =>
                                        router.push(`/dashboard/agents/${a.id}`)
                                    }
                                    className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                                        i < agents.length - 1 ? "border-b" : ""
                                    }`}
                                >
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <span
                                                className="size-7 shrink-0 rounded-md border"
                                                style={{
                                                    backgroundColor:
                                                        a.brandColor ??
                                                        "var(--muted)",
                                                }}
                                                aria-hidden
                                            />
                                            <div className="flex flex-col">
                                                <span className="font-medium">
                                                    {a.name}
                                                </span>
                                                <span className="font-mono text-xs text-muted-foreground">
                                                    {a.slug}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 hidden md:table-cell">
                                        <div className="flex flex-col">
                                            <span>{a.ownerName ?? "—"}</span>
                                            <span className="text-xs text-muted-foreground">
                                                {a.ownerEmail}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 hidden lg:table-cell">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-muted-foreground">
                                                {a.customDomain ??
                                                    a.subdomain ??
                                                    "—"}
                                            </span>
                                            {a.customDomain ? (
                                                <DomainStatusBadge
                                                    status={a.domainStatus}
                                                />
                                            ) : a.subdomain ? (
                                                <DomainStatusBadge status="active" />
                                            ) : (
                                                <DomainStatusBadge
                                                    status={null}
                                                />
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <ServiceStatusBadge
                                            status={a.serviceStatus}
                                        />
                                    </td>
                                    <td
                                        className="px-4 py-3"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <div className="flex justify-end">
                                            <Switch
                                                checked={
                                                    a.serviceStatus === "active"
                                                }
                                                disabled={
                                                    serviceMutation.isPending
                                                }
                                                onCheckedChange={() =>
                                                    toggleService(a)
                                                }
                                                aria-label={`Toggle service for ${a.name}`}
                                            />
                                        </div>
                                    </td>
                                    <td
                                        className="px-4 py-3"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <div className="flex justify-end gap-1">
                                            <Button
                                                asChild
                                                variant="ghost"
                                                size="icon-sm"
                                                aria-label={`Edit ${a.name}`}
                                                className="text-muted-foreground hover:text-foreground"
                                            >
                                                <Link
                                                    href={`/dashboard/agents/${a.id}/edit`}
                                                >
                                                    <SquarePen />
                                                </Link>
                                            </Button>
                                            <DeleteAgentDialog agent={a}>
                                                <Button
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    aria-label={`Delete ${a.name}`}
                                                    className="text-muted-foreground hover:text-destructive"
                                                >
                                                    <Trash2 />
                                                </Button>
                                            </DeleteAgentDialog>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <Empty className="border border-dashed">
                    <EmptyHeader>
                        <EmptyMedia variant="icon">
                            <Users />
                        </EmptyMedia>
                        <EmptyTitle>No agents yet</EmptyTitle>
                        <EmptyDescription>
                            Add your first agent to provision their branded site.
                        </EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent>
                        <Button asChild>
                            <Link href="/dashboard/agents/new">
                                <Plus data-icon="inline-start" />
                                Add Agent
                            </Link>
                        </Button>
                    </EmptyContent>
                </Empty>
            )}
        </div>
    );
}
