"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";

/**
 * Lightweight scroll-reveal: fades + lifts content into view once. Used to add
 * subtle motion across the marketing home page without heavy choreography.
 */
export default function Reveal({
    children,
    className,
    delay = 0,
    y = 18,
    as = "div",
}: {
    children: ReactNode;
    className?: string;
    delay?: number;
    y?: number;
    as?: "div" | "li" | "section";
}) {
    const MotionTag = motion[as];
    return (
        <MotionTag
            className={className}
            initial={{ opacity: 0, y }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{
                duration: 0.55,
                delay,
                ease: [0.21, 0.47, 0.32, 0.98],
            }}
        >
            {children}
        </MotionTag>
    );
}
