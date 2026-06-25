"use client";

import Link from "next/link";
import {
    Building2,
    Map,
    MapPinned,
    LayoutTemplate,
    Plus,
    Eye,
    MousePointerClick,
    CalendarCheck,
    Users,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { useSession, isPlatformAdmin } from "@/lib/auth-client";
import { getMyAgent } from "@/api/agent";
import { getOverviewStats } from "@/api/stats";

const agentStats = [
    { label: "Visitors (30d)", value: "—", icon: Eye },
    { label: "Listing clicks", value: "—", icon: MousePointerClick },
    { label: "Leads", value: "—", icon: Users },
    { label: "Tours booked", value: "—", icon: CalendarCheck },
];

function AdminOverview() {
    const { data: stats, isPending, isError } = useQuery({
        queryKey: ["overview-stats"],
        queryFn: getOverviewStats,
    });

    const adminStats = [
        { label: "Communities", value: stats?.communities, icon: Building2 },
        { label: "Regions", value: stats?.regions, icon: Map },
        { label: "Counties", value: stats?.counties, icon: MapPinned },
        { label: "Floor Plans", value: stats?.floorPlans, icon: LayoutTemplate },
    ];

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Overview
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Manage the community catalog and agent sites.
                    </p>
                </div>
                <Button asChild>
                    <Link href="/dashboard/communities/new">
                        <Plus data-icon="inline-start" />
                        Add Community
                    </Link>
                </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {adminStats.map((stat) => (
                    <Card key={stat.label}>
                        <CardHeader>
                            <CardDescription>{stat.label}</CardDescription>
                            <CardTitle className="text-3xl">
                                {isPending ? (
                                    <Skeleton className="h-9 w-12" />
                                ) : isError ? (
                                    "—"
                                ) : (
                                    stat.value
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <stat.icon className="size-5 text-muted-foreground" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

function AgentOverview() {
    const { data: agent } = useQuery({
        queryKey: ["my-agent"],
        queryFn: getMyAgent,
    });
    const siteName = agent?.siteName ?? agent?.name ?? "your site";
    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-semibold tracking-tight">
                    Overview
                </h1>
                <p className="text-sm text-muted-foreground">
                    Performance for {siteName}. Stats are placeholders until
                    analytics are wired up.
                </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {agentStats.map((stat) => (
                    <Card key={stat.label}>
                        <CardHeader>
                            <CardDescription>{stat.label}</CardDescription>
                            <CardTitle className="text-3xl">
                                {stat.value}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <stat.icon className="size-5 text-muted-foreground" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

export default function DashboardPage() {
    const { data: session } = useSession();
    return isPlatformAdmin(session?.user) ? (
        <AdminOverview />
    ) : (
        <AgentOverview />
    );
}
