import { Loader2 } from "lucide-react";
import { Badge } from "@workspace/ui/components/badge";
import { cn } from "@workspace/ui/lib/utils";
import type { DomainStatus, ServiceStatus } from "@/api/agent";

export function ServiceStatusBadge({ status }: { status: ServiceStatus }) {
    return (
        <Badge
            variant="outline"
            className={cn(
                "gap-1.5",
                status === "active"
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                    : "border-destructive/30 bg-destructive/10 text-destructive",
            )}
        >
            <span
                className={cn(
                    "size-1.5 rounded-full",
                    status === "active" ? "bg-emerald-500" : "bg-destructive",
                )}
            />
            {status === "active" ? "Active" : "Suspended"}
        </Badge>
    );
}

export function DomainStatusBadge({ status }: { status: DomainStatus | null }) {
    if (!status) {
        return (
            <Badge variant="outline" className="text-muted-foreground">
                No domain
            </Badge>
        );
    }

    if (status === "provisioning") {
        return (
            <Badge
                variant="outline"
                className="gap-1.5 border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400"
            >
                <Loader2 className="size-3 animate-spin" />
                Issuing SSL
            </Badge>
        );
    }

    return (
        <Badge
            variant="outline"
            className={cn(
                "gap-1.5",
                status === "active"
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                    : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
            )}
        >
            <span
                className={cn(
                    "size-1.5 rounded-full",
                    status === "active" ? "bg-emerald-500" : "bg-amber-500",
                )}
            />
            {status === "active" ? "Active" : "Pending"}
        </Badge>
    );
}
