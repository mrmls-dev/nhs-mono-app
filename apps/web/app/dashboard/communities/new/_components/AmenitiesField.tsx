"use client";

import { useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { ChevronsUpDown, Plus, X } from "lucide-react";
import { Badge } from "@workspace/ui/components/badge";
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
import { FieldSet } from "@workspace/ui/components/field";
import { getAmenities } from "@/api/community";
import type { CommunityFormValues } from "../community-schema";

export function AmenitiesField() {
    const { control } = useFormContext<CommunityFormValues>();
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");

    // Existing amenities power the autocomplete. The backend upserts by name on
    // save, so unknown values are created automatically — no write needed here.
    const { data: existing = [] } = useQuery({
        queryKey: ["amenities"],
        queryFn: getAmenities,
    });

    return (
        <Controller
            control={control}
            name="amenities"
            render={({ field }) => {
                const selected = field.value ?? [];

                const add = (raw: string) => {
                    const name = raw.trim();
                    if (!name) return;
                    const exists = selected.some(
                        (a) => a.toLowerCase() === name.toLowerCase(),
                    );
                    if (!exists) field.onChange([...selected, name]);
                    setQuery("");
                };

                const remove = (name: string) => {
                    field.onChange(selected.filter((a) => a !== name));
                };

                const q = query.trim().toLowerCase();
                // Existing amenities not already selected, filtered by the query.
                const suggestions = existing.filter(
                    (a) =>
                        !selected.some(
                            (s) => s.toLowerCase() === a.toLowerCase(),
                        ) && a.toLowerCase().includes(q),
                );
                // Offer "create" when the typed value matches nothing exactly.
                const exactMatch = [...selected, ...existing].some(
                    (a) => a.toLowerCase() === q,
                );
                const showCreate = q.length > 0 && !exactMatch;

                return (
                    <FieldSet className="gap-3">
                        {selected.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {selected.map((a) => (
                                    <Badge
                                        key={a}
                                        variant="secondary"
                                        className="gap-1 pr-1"
                                    >
                                        {a}
                                        <button
                                            type="button"
                                            onClick={() => remove(a)}
                                            aria-label={`Remove ${a}`}
                                            className="rounded-sm opacity-70 transition-opacity hover:opacity-100"
                                        >
                                            <X className="size-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        )}

                        <Popover open={open} onOpenChange={setOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    type="button"
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={open}
                                    className="w-full justify-between font-normal text-muted-foreground sm:w-80"
                                >
                                    Add amenity…
                                    <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent
                                className="w-(--radix-popover-trigger-width) p-0"
                                align="start"
                            >
                                {/* Manual filtering: keeps the "create" item visible regardless of cmdk's matcher. */}
                                <Command shouldFilter={false}>
                                    <CommandInput
                                        placeholder="Search or create…"
                                        value={query}
                                        onValueChange={setQuery}
                                    />
                                    <CommandList>
                                        {suggestions.length === 0 &&
                                            !showCreate && (
                                                <CommandEmpty>
                                                    No amenities found.
                                                </CommandEmpty>
                                            )}
                                        {suggestions.length > 0 && (
                                            <CommandGroup heading="Existing">
                                                {suggestions.map((a) => (
                                                    <CommandItem
                                                        key={a}
                                                        value={a}
                                                        onSelect={() => add(a)}
                                                    >
                                                        {a}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        )}
                                        {showCreate && (
                                            <CommandGroup>
                                                <CommandItem
                                                    value={`create-${query}`}
                                                    onSelect={() => add(query)}
                                                >
                                                    <Plus className="size-4 shrink-0" />
                                                    Create “{query.trim()}”
                                                </CommandItem>
                                            </CommandGroup>
                                        )}
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </FieldSet>
                );
            }}
        />
    );
}
