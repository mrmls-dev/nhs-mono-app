"use client";

import type { ComponentProps, ReactNode } from "react";
import { Button } from "@workspace/ui/components/button";
import { openBuyerMatch } from "@/lib/home-data";

type ButtonProps = ComponentProps<typeof Button>;

/**
 * Reusable marketing CTA. Opens the `BuyerMatchSurvey` at `step` (default 1)
 * and smooth-scrolls it into view via the `buyer-match:open` event bus.
 */
export default function OpenSurveyButton({
    step = 1,
    children,
    ...props
}: {
    step?: number;
    children: ReactNode;
} & Omit<ButtonProps, "onClick">) {
    return (
        <Button type="button" onClick={() => openBuyerMatch(step)} {...props}>
            {children}
        </Button>
    );
}
