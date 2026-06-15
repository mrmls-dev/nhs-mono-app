"use client";

import { AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useSession, isPlatformAdmin } from "@/lib/auth-client";
import { getMyAgent } from "@/api/agent";

/**
 * Shown across the agent dashboard when their org's `serviceStatus` is
 * "suspended" (payment lapsed). The agent can still navigate the dashboard —
 * only their public site is taken down. Admins don't see this.
 */
export function PaymentWarningBanner() {
    const { data: session } = useSession();
    const isAdmin = isPlatformAdmin(session?.user);

    const { data: agent } = useQuery({
        queryKey: ["my-agent"],
        queryFn: getMyAgent,
        enabled: Boolean(session?.user) && !isAdmin,
    });

    if (isAdmin || !agent || agent.serviceStatus !== "suspended") return null;

    return (
        <div className="flex items-start gap-3 border-b border-destructive/30 bg-destructive/10 px-4 py-3 text-sm md:px-6">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" />
            <div className="flex flex-col gap-0.5">
                <p className="font-medium text-destructive">
                    Payment required — your public site is currently offline.
                </p>
                <p className="text-destructive/90">
                    Your subscription is past due, so {agent.siteName ?? agent.name}{" "}
                    is not being served to visitors. You can still manage your
                    settings here. Please contact National House Search to restore
                    service.
                </p>
            </div>
        </div>
    );
}
