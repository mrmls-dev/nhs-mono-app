"use client";

import { useState } from "react";

export default function ExpandableText({
    text,
    lines = 6,
}: {
    text: string;
    lines?: number;
}) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="flex flex-col gap-2">
            <p
                className="text-foreground/90 leading-relaxed transition-all"
                style={
                    expanded
                        ? undefined
                        : {
                              WebkitLineClamp: lines,
                              display: "-webkit-box",
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                          }
                }
            >
                {text}
            </p>
            <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="self-start text-sm font-semibold text-primary hover:underline"
            >
                {expanded ? "See less" : "See more"}
            </button>
        </div>
    );
}
