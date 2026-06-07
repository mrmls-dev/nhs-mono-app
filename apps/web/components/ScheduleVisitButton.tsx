import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";

export default function ScheduleVisitButton({
    size = "md",
    className = "",
    comm,
    fpModel,
}: {
    size?: "sm" | "md" | "lg";
    className?: string;
    comm?: string;
    fpModel?: string;
}) {
    const params = new URLSearchParams();
    if (comm) params.set("comm", comm);
    if (fpModel) params.set("fp-model", fpModel);
    const query = params.toString();
    const href = query ? `/schedule?${query}` : "/schedule";

    const sizeClasses = {
        sm: "h-8 px-3 text-xs gap-1.5",
        md: "h-9 px-4 text-sm gap-2",
        lg: "h-11 px-6 text-base gap-2",
    };

    return (
        <Button asChild className={cn(sizeClasses[size], className)}>
            <Link href={href} target="_blank" rel="noopener noreferrer">
                <CalendarDays className="size-4 shrink-0" aria-hidden />
                Schedule a Visit
            </Link>
        </Button>
    );
}
