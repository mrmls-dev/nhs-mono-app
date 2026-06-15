"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

/**
 * Light/dark switch for the public marketing site. Flips next-themes (which
 * toggles `.dark` on `<html>`), activating the tenant theme's dark token set.
 */
export function PublicThemeToggle() {
    const { resolvedTheme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Theme is unknown during SSR; render a stable placeholder until mounted.
    useEffect(() => setMounted(true), []);

    const isDark = resolvedTheme === "dark";

    return (
        <button
            type="button"
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="inline-flex size-8 sm:size-10 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-border hover:text-foreground"
        >
            {mounted && isDark ? (
                <Sun className="size-4 shrink-0" />
            ) : (
                <Moon className="size-4 shrink-0" />
            )}
        </button>
    );
}
