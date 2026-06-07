"use client";

import { useState } from "react";

const IFRAME_BASE =
    "https://api.mostro360.com/widget/booking/QfKesnbDaIdO1N9ZFkZN";
const IFRAME_ID = "QfKesnbDaIdO1N9ZFkZN_1778865423563";

export default function ScheduleIframe({
    comm,
    fpModel,
}: {
    comm?: string;
    fpModel?: string;
}) {
    const [loaded, setLoaded] = useState(false);

    const params = new URLSearchParams();
    if (comm) params.set("comm", comm);
    if (fpModel) params.set("fp-model", fpModel);
    const query = params.toString();
    const src = query ? `${IFRAME_BASE}?${query}` : IFRAME_BASE;

    return (
        <div className="relative min-h-175 rounded-xl overflow-hidden bg-muted">
            {!loaded && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    <div className="size-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                    <p className="text-sm text-muted-foreground font-medium">
                        Loading scheduler…
                    </p>
                </div>
            )}
            <iframe
                src={src}
                id={IFRAME_ID}
                onLoad={() => setLoaded(true)}
                style={{ width: "100%", border: "none", overflow: "hidden" }}
                className={`min-h-175 transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
            />
        </div>
    );
}
