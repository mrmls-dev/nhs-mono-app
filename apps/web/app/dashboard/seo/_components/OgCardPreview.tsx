"use client";

import { Building2 } from "lucide-react";
import type { OgPalette } from "@/lib/og-theme";

/**
 * Approximate live preview of how a shared link's social card looks: the OG
 * image (logo + brand colors, matching the Satori-rendered home card) with the
 * title / description / domain shown beneath, like Facebook or LinkedIn. This
 * is a CSS replica, not the exact PNG.
 */
export function OgCardPreview({
    logo,
    palette,
    title,
    description,
    domain,
}: {
    logo: string | null;
    palette: OgPalette;
    title: string;
    description: string;
    domain: string;
}) {
    return (
        <div className="w-full max-w-md overflow-hidden rounded-lg border bg-card">
            {/* OG image art (1.91:1) */}
            <div
                className="relative flex aspect-[1200/630] w-full flex-col justify-between p-5"
                style={{ background: palette.bg }}
            >
                <div
                    className="absolute inset-y-0 left-0 w-1"
                    style={{ background: palette.accent }}
                />
                {/* Logo badge */}
                <div className="flex h-10 max-w-[55%] items-center self-start rounded-md bg-white px-2.5 py-1">
                    {logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={logo}
                            alt=""
                            className="h-full w-full object-contain"
                        />
                    ) : (
                        <Building2 className="size-5 text-neutral-700" />
                    )}
                </div>

                <div className="flex flex-col gap-1">
                    <span className="text-lg font-extrabold leading-none text-white">
                        New Construction
                    </span>
                    <span className="text-sm font-light text-white/60">
                        Communities and Floor Plans
                    </span>
                    <div className="mt-1.5 flex items-center gap-2">
                        <div
                            className="h-0.5 w-8"
                            style={{ background: palette.accent }}
                        />
                        <span
                            className="text-[11px] font-medium"
                            style={{ color: palette.accent }}
                        >
                            Southeast Florida
                        </span>
                    </div>
                </div>
            </div>

            {/* Social card meta */}
            <div className="flex flex-col gap-0.5 border-t px-3 py-2">
                <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    {domain}
                </span>
                <span className="line-clamp-1 text-sm font-semibold text-foreground">
                    {title}
                </span>
                {description && (
                    <span className="line-clamp-2 text-xs text-muted-foreground">
                        {description}
                    </span>
                )}
            </div>
        </div>
    );
}
