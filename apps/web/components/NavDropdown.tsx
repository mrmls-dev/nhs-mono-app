"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";

type County = { id: string; name: string };

export default function NavDropdown({ counties }: { counties: County[] }) {
    const searchParams = useSearchParams();
    const activeCounty = searchParams.get("county");
    const activeLabel =
        counties.find((c) => c.id === activeCounty)?.name ?? "All Counties";

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button className="gap-1.5 px-3 h-8 sm:px-5 sm:h-10 text-xs sm:text-sm max-w-30 sm:max-w-none">
                    <span className="truncate">{activeLabel}</span>
                    <ChevronDown className="size-3.5 sm:size-4 shrink-0" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-48">
                <DropdownMenuItem asChild>
                    <Link
                        href="/communities"
                        className={cn(
                            "cursor-pointer",
                            !activeCounty && "font-semibold text-primary",
                        )}
                    >
                        All Counties
                    </Link>
                </DropdownMenuItem>
                {counties.map((county) => (
                    <DropdownMenuItem key={county.id} asChild>
                        <Link
                            href={`/communities?county=${county.id}`}
                            className={cn(
                                "cursor-pointer",
                                activeCounty === county.id &&
                                    "font-semibold text-primary",
                            )}
                        >
                            {county.name}
                        </Link>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
