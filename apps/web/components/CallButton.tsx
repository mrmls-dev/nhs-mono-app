import { Phone } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";

/**
 * "Call" CTA, the secondary counterpart to ScheduleVisitButton. Renders the
 * agent's dynamic `contactPhone` (same source as the footer) as a proper button
 * — `outline` so it pairs with the filled Schedule button — not a raw <a>.
 * Renders nothing when the agent has no phone configured.
 */
export default function CallButton({
    phone,
    size = "md",
    className = "",
}: {
    phone?: string | null;
    size?: "sm" | "md" | "lg";
    className?: string;
}) {
    if (!phone) return null;

    const sizeClasses = {
        sm: "h-8 px-3 text-xs gap-1.5",
        md: "h-9 px-4 text-sm gap-2",
        lg: "h-11 px-6 text-base gap-2",
    };

    return (
        <Button
            asChild
            variant="outline"
            className={cn(sizeClasses[size], className)}
        >
            <a href={`tel:${phone.replace(/\D/g, "")}`}>
                <Phone className="size-4 shrink-0" aria-hidden />
                {phone}
            </a>
        </Button>
    );
}
