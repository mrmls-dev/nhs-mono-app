import Link from "next/link";
import { Building2, Map, MapPinned, LayoutTemplate, Plus } from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";

const stats = [
    { label: "Communities", value: 0, icon: Building2 },
    { label: "Regions", value: 0, icon: Map },
    { label: "Counties", value: 0, icon: MapPinned },
    { label: "Floor Plans", value: 0, icon: LayoutTemplate },
];

export default function DashboardPage() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Overview
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Manage communities, regions, and floor plans.
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
                {stats.map((stat) => (
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
