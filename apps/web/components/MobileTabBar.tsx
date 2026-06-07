"use client";

import { useState } from "react";
import { Home, MapPin, LayoutGrid } from "lucide-react";

type Tab = "home" | "map" | "communities";

function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

const tabCls = (active: boolean) =>
    `flex-1 flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl transition-all ${
        active
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground active:scale-95"
    }`;

export default function MobileTabBar() {
    const [active, setActive] = useState<Tab>("communities");

    const go = (tab: Tab, id: string) => {
        setActive(tab);
        scrollTo(id);
    };

    return (
        <nav
            aria-label="Mobile navigation"
            className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 md:hidden w-[80vw]"
        >
            <div className="flex items-center bg-white/90 backdrop-blur-md border border-border shadow-2xl rounded-2xl px-1.5 py-1.5 gap-1">
                <a
                    href="https://nationalhousesearch.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setActive("home")}
                    className={tabCls(active === "home")}
                >
                    <Home className="size-5" />
                    <span className="text-[11px] font-semibold tracking-wide">Home</span>
                </a>

                <button
                    type="button"
                    onClick={() => go("map", "map-section")}
                    className={tabCls(active === "map")}
                >
                    <MapPin className="size-5" />
                    <span className="text-[11px] font-semibold tracking-wide">Map</span>
                </button>

                <button
                    type="button"
                    onClick={() => go("communities", "listings-section")}
                    className={tabCls(active === "communities")}
                >
                    <LayoutGrid className="size-5" />
                    <span className="text-[11px] font-semibold tracking-wide">Communities</span>
                </button>
            </div>
        </nav>
    );
}
