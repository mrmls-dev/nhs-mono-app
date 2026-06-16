"use client";

import { useMemo, useState } from "react";
import moment from "moment-timezone";
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

/**
 * Searchable timezone picker backed by the full moment-timezone (IANA) name
 * list, each labelled with its current GMT offset. Stores the IANA zone name
 * (e.g. "America/New_York") as the value.
 */
export function TimezoneCombobox({
    id,
    value,
    onChange,
}: {
    id?: string;
    value: string;
    onChange: (value: string) => void;
}) {
    const [open, setOpen] = useState(false);

    const zones = useMemo(
        () =>
            moment.tz.names().map((name) => ({
                name,
                label: `${name} (GMT${moment.tz(name).format("Z")})`,
            })),
        [],
    );

    const current = zones.find((z) => z.name === value);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    id={id}
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between font-normal"
                >
                    <span className="truncate">
                        {current?.label ?? value ?? "Select timezone…"}
                    </span>
                    <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-(--radix-popover-trigger-width) p-0"
                align="start"
            >
                <Command>
                    <CommandInput placeholder="Search timezone…" />
                    <CommandList>
                        <CommandEmpty>No timezone found.</CommandEmpty>
                        <CommandGroup>
                            {zones.map((z) => (
                                <CommandItem
                                    key={z.name}
                                    value={z.label}
                                    onSelect={() => {
                                        onChange(z.name);
                                        setOpen(false);
                                    }}
                                >
                                    <span className="truncate">{z.label}</span>
                                    <Check
                                        className={cn(
                                            "ml-auto size-4",
                                            z.name === value
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
