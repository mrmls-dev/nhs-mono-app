"use client";

import { useState } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@workspace/ui/components/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@workspace/ui/components/popover";
import { cn } from "@workspace/ui/lib/utils";
import { useAgents } from "./use-agent";

const SECTIONS = ["details", "branding", "domain"] as const;

/** Current `/dashboard/agents/[id]/<section>` segment, defaulting to details. */
function useSection() {
    const pathname = usePathname();
    const last = pathname.split("/").at(-1) ?? "";
    return (SECTIONS as readonly string[]).includes(last) ? last : "details";
}

export function AgentSwitcher() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const section = useSection();
    const [open, setOpen] = useState(false);

    const { data: agents = [] } = useAgents();
    const current = agents.find((a) => a.id === params.id);

    const select = (id: string) => {
        setOpen(false);
        if (id !== params.id) {
            router.push(`/dashboard/agents/${id}/${section}`);
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between font-normal"
                >
                    <span className="flex min-w-0 items-center gap-2">
                        <span
                            className="size-4 shrink-0 rounded-sm border"
                            style={{
                                backgroundColor:
                                    current?.brandColor ?? "var(--muted)",
                            }}
                            aria-hidden
                        />
                        <span className="truncate">
                            {current?.name ?? "Select agent"}
                        </span>
                    </span>
                    <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-(--radix-popover-trigger-width) p-0"
                align="start"
            >
                <Command>
                    <CommandInput placeholder="Search agents…" />
                    <CommandList>
                        <CommandEmpty>No agents found.</CommandEmpty>
                        <CommandGroup>
                            {agents.map((a) => (
                                <CommandItem
                                    key={a.id}
                                    value={`${a.name} ${a.slug}`}
                                    onSelect={() => select(a.id)}
                                >
                                    <span
                                        className="size-4 shrink-0 rounded-sm border"
                                        style={{
                                            backgroundColor:
                                                a.brandColor ?? "var(--muted)",
                                        }}
                                        aria-hidden
                                    />
                                    <span className="flex min-w-0 flex-col">
                                        <span className="truncate">
                                            {a.name}
                                        </span>
                                        <span className="truncate font-mono text-xs text-muted-foreground">
                                            {a.slug}
                                        </span>
                                    </span>
                                    <Check
                                        className={cn(
                                            "ml-auto size-4",
                                            a.id === params.id
                                                ? "opacity-100"
                                                : "opacity-0",
                                        )}
                                    />
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
