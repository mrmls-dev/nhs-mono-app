"use client";

import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { openBuyerMatch } from "@/lib/home-data";

/**
 * Primary header CTA. On the home page (where the survey is mounted) it opens
 * the survey and scrolls to it; elsewhere it routes home so the visitor lands
 * on the survey.
 */
export default function FindMyMatchButton() {
    const router = useRouter();

    const handleClick = () => {
        if (
            typeof document !== "undefined" &&
            document.getElementById("buyer-match")
        ) {
            openBuyerMatch(1);
        } else {
            router.push("/");
        }
    };

    return (
        <Button
            type="button"
            onClick={handleClick}
            className="h-8 gap-1.5 px-3 text-xs sm:h-10 sm:px-5 sm:text-sm"
        >
            <Sparkles className="size-3.5 shrink-0 sm:size-4" aria-hidden />
            Find my match
        </Button>
    );
}
