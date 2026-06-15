"use client";

import {
    Loader2,
    Globe,
    Copy,
    Calendar,
    Mail,
    User,
    Phone,
    MapPin,
    Building2,
    Clock,
    Link2,
    Tag,
    Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@workspace/ui/components/card";
import { Switch } from "@workspace/ui/components/switch";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import { setServiceStatus, type ServiceStatus } from "@/api/agent";
import {
    DomainStatusBadge,
    ServiceStatusBadge,
} from "../../../_components/StatusChips";
import { DeleteAgentDialog } from "../../_components/DeleteAgentDialog";
import { useAgent } from "./use-agent";

function Loading() {
    return (
        <div className="flex items-center justify-center rounded-lg border border-dashed py-16 text-sm text-muted-foreground">
            <Loader2 className="mr-2 size-4 animate-spin" />
            Loading…
        </div>
    );
}

function Row({
    icon: Icon,
    label,
    children,
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex items-start justify-between gap-4 py-3">
            <span className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
                <Icon className="size-4" />
                {label}
            </span>
            <span className="min-w-0 text-right text-sm font-medium wrap-break-word">
                {children}
            </span>
        </div>
    );
}

export function AgentDetailsClient({ agentId }: { agentId: string }) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { agent, isLoading } = useAgent(agentId);

    const serviceMutation = useMutation({
        mutationFn: (status: ServiceStatus) =>
            setServiceStatus(agentId, status),
        onSuccess: (updated) => {
            queryClient.invalidateQueries({ queryKey: ["agents"] });
            toast.success(
                updated.serviceStatus === "active"
                    ? "Service restored."
                    : "Service suspended.",
            );
        },
        onError: (err: Error) => toast.error(err.message),
    });

    if (isLoading) return <Loading />;
    if (!agent) {
        return (
            <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">
                Agent not found.
            </div>
        );
    }

    const copy = (value: string) => {
        navigator.clipboard?.writeText(value);
        toast.success("Copied to clipboard.");
    };

    const createdAt = new Date(agent.createdAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
    });

    const fullAddress = [agent.address, agent.city, agent.state, agent.postalCode, agent.country]
        .filter(Boolean)
        .join(", ");

    return (
        <div className="grid gap-6 lg:grid-cols-2">
            {/* ── Service status ─────────────────────────────────────────────── */}
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle>Service status</CardTitle>
                    <CardDescription>
                        Suspending takes {agent.name}&apos;s public site offline
                        and shows a payment notice in their dashboard.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
                        <div className="flex items-center gap-3">
                            <ServiceStatusBadge status={agent.serviceStatus} />
                            <span className="text-sm text-muted-foreground">
                                {agent.serviceStatus === "active"
                                    ? "Site is live and reachable."
                                    : "Site is offline."}
                            </span>
                        </div>
                        <Switch
                            checked={agent.serviceStatus === "active"}
                            disabled={serviceMutation.isPending}
                            onCheckedChange={(checked) =>
                                serviceMutation.mutate(
                                    checked ? "active" : "suspended",
                                )
                            }
                            aria-label={`Toggle service for ${agent.name}`}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* ── Account ────────────────────────────────────────────────────── */}
            <Card>
                <CardHeader>
                    <CardTitle>Account</CardTitle>
                    <CardDescription>
                        Platform login and organization identity.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="divide-y">
                        <Row icon={User} label="Owner">
                            {agent.ownerFirstName && agent.ownerLastName
                                ? `${agent.ownerFirstName} ${agent.ownerLastName}`
                                : (agent.ownerName ?? "—")}
                        </Row>
                        <Row icon={Mail} label="Login email">
                            {agent.ownerEmail ?? "—"}
                        </Row>
                        <Row icon={Building2} label="Company name">
                            {agent.name}
                        </Row>
                        <Row icon={Tag} label="Slug">
                            <span className="font-mono text-xs">{agent.slug}</span>
                        </Row>
                        {agent.businessType && (
                            <Row icon={Building2} label="Business type">
                                {agent.businessType}
                            </Row>
                        )}
                        <Row icon={Calendar} label="Created">
                            {createdAt}
                        </Row>
                    </div>
                </CardContent>
            </Card>

            {/* ── Business contact ───────────────────────────────────────────── */}
            <Card>
                <CardHeader>
                    <CardTitle>Business contact</CardTitle>
                    <CardDescription>
                        Public-facing contact details sent to GHL as
                        prospectInfo.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="divide-y">
                        <Row icon={Mail} label="Business email">
                            {agent.businessEmail ?? agent.ownerEmail ?? "—"}
                        </Row>
                        <Row icon={Phone} label="Phone">
                            {agent.contactPhone ?? "—"}
                        </Row>
                        {agent.website && (
                            <Row icon={Link2} label="Website">
                                <a
                                    href={agent.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary underline-offset-4 hover:underline"
                                >
                                    {agent.website.replace(/^https?:\/\//, "")}
                                </a>
                            </Row>
                        )}
                        <Row icon={Clock} label="Timezone">
                            {agent.timezone ?? "—"}
                        </Row>
                    </div>
                </CardContent>
            </Card>

            {/* ── Address ────────────────────────────────────────────────────── */}
            <Card>
                <CardHeader>
                    <CardTitle>Address</CardTitle>
                    <CardDescription>Business location for GHL sub-account.</CardDescription>
                </CardHeader>
                <CardContent>
                    {fullAddress ? (
                        <div className="divide-y">
                            {agent.address && (
                                <Row icon={MapPin} label="Street">
                                    {agent.address}
                                </Row>
                            )}
                            {agent.city && (
                                <Row icon={MapPin} label="City">
                                    {agent.city}
                                </Row>
                            )}
                            {agent.state && (
                                <Row icon={MapPin} label="State">
                                    {agent.state}
                                </Row>
                            )}
                            {agent.postalCode && (
                                <Row icon={MapPin} label="ZIP">
                                    {agent.postalCode}
                                </Row>
                            )}
                            {agent.country && (
                                <Row icon={MapPin} label="Country">
                                    {agent.country}
                                </Row>
                            )}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            No address on file.
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* ── Site addresses ─────────────────────────────────────────────── */}
            <Card>
                <CardHeader>
                    <CardTitle>Site addresses</CardTitle>
                    <CardDescription>
                        Where this agent&apos;s site is reachable.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
                        <div className="flex min-w-0 items-center gap-3">
                            <Globe className="size-5 shrink-0 text-muted-foreground" />
                            <div className="flex min-w-0 flex-col">
                                <span className="text-xs text-muted-foreground">
                                    Platform subdomain
                                </span>
                                <span className="truncate font-medium">
                                    {agent.subdomain ?? "—"}
                                </span>
                            </div>
                        </div>
                        {agent.subdomain && (
                            <div className="flex items-center gap-2">
                                <DomainStatusBadge status="active" />
                                <Button
                                    variant="ghost"
                                    size="icon-xs"
                                    aria-label="Copy subdomain"
                                    onClick={() => copy(agent.subdomain!)}
                                >
                                    <Copy className="size-4 text-muted-foreground" />
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
                        <div className="flex min-w-0 items-center gap-3">
                            <Globe className="size-5 shrink-0 text-muted-foreground" />
                            <div className="flex min-w-0 flex-col">
                                <span className="text-xs text-muted-foreground">
                                    Custom domain
                                </span>
                                <span className="truncate font-medium">
                                    {agent.customDomain ?? "Not connected"}
                                </span>
                            </div>
                        </div>
                        {agent.customDomain && (
                            <DomainStatusBadge status={agent.domainStatus} />
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* ── GHL sub-account ────────────────────────────────────────────── */}
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle>GoHighLevel sub-account</CardTitle>
                    <CardDescription>
                        Status and settings for the GHL sub-account. Location ID
                        is set once the sub-account is provisioned.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
                        <span className="text-sm text-muted-foreground">
                            Location ID
                        </span>
                        {agent.ghlLocationId ? (
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-sm">
                                    {agent.ghlLocationId}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="icon-xs"
                                    aria-label="Copy GHL location ID"
                                    onClick={() => copy(agent.ghlLocationId!)}
                                >
                                    <Copy className="size-4 text-muted-foreground" />
                                </Button>
                            </div>
                        ) : (
                            <Badge variant="outline" className="text-muted-foreground">
                                Not provisioned
                            </Badge>
                        )}
                    </div>

                    <div className="overflow-hidden rounded-lg border">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/50 text-left text-muted-foreground">
                                    <th className="px-4 py-2.5 font-medium">
                                        Setting
                                    </th>
                                    <th className="px-4 py-2.5 font-medium text-right">
                                        Value
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {(
                                    [
                                        ["Allow duplicate contacts", agent.ghlAllowDuplicateContact],
                                        ["Allow duplicate opportunities", agent.ghlAllowDuplicateOpportunity],
                                        ["Allow Facebook name merge", agent.ghlAllowFacebookNameMerge],
                                        ["Disable contact timezone", agent.ghlDisableContactTimezone],
                                    ] as [string, boolean][]
                                ).map(([label, value], i, arr) => (
                                    <tr
                                        key={label}
                                        className={i < arr.length - 1 ? "border-b" : ""}
                                    >
                                        <td className="px-4 py-2.5 text-muted-foreground">
                                            {label}
                                        </td>
                                        <td className="px-4 py-2.5 text-right">
                                            <Badge
                                                variant="outline"
                                                className={
                                                    value
                                                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                                                        : "text-muted-foreground"
                                                }
                                            >
                                                {value ? "On" : "Off"}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* ── Danger zone ────────────────────────────────────────────────── */}
            <Card className="border-destructive/30 lg:col-span-2">
                <CardHeader>
                    <CardTitle className="text-destructive">
                        Danger zone
                    </CardTitle>
                    <CardDescription>
                        Permanently delete this agent and everything tied to it —
                        their organization, owner login, custom domain, and site
                        access. This cannot be undone.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 p-4">
                        <span className="text-sm text-muted-foreground">
                            Deleting {agent.name} is irreversible.
                        </span>
                        <DeleteAgentDialog
                            agent={agent}
                            onDeleted={() => router.push("/dashboard/agents")}
                        >
                            <Button variant="destructive">
                                <Trash2 data-icon="inline-start" />
                                Delete agent
                            </Button>
                        </DeleteAgentDialog>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
