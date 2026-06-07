"use client";

import { Controller, useFormContext } from "react-hook-form";
import { Checkbox } from "@workspace/ui/components/checkbox";
import {
    Field,
    FieldLabel,
    FieldSet,
} from "@workspace/ui/components/field";
import type { CommunityFormValues } from "../community-schema";

const AMENITY_OPTIONS = [
    "Dog Park",
    "Golf",
    "Pickleball",
    "Tennis",
    "Basketball Court",
    "Club House",
    "Community Pools",
    "Fitness Center",
    "Playground",
    "Walking Trails",
    "Gated",
] as const;

export function AmenitiesField() {
    const { control } = useFormContext<CommunityFormValues>();

    return (
        <Controller
            control={control}
            name="amenities"
            render={({ field }) => {
                const selected = field.value ?? [];
                const toggle = (amenity: string, checked: boolean) => {
                    if (checked) {
                        field.onChange([...selected, amenity]);
                    } else {
                        field.onChange(
                            selected.filter((a) => a !== amenity),
                        );
                    }
                };

                return (
                    <FieldSet>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                            {AMENITY_OPTIONS.map((amenity) => {
                                const id = `amenity-${amenity
                                    .toLowerCase()
                                    .replace(/\s+/g, "-")}`;
                                return (
                                    <Field
                                        key={amenity}
                                        orientation="horizontal"
                                    >
                                        <Checkbox
                                            id={id}
                                            checked={selected.includes(amenity)}
                                            onCheckedChange={(checked) =>
                                                toggle(amenity, checked === true)
                                            }
                                        />
                                        <FieldLabel
                                            htmlFor={id}
                                            className="font-normal"
                                        >
                                            {amenity}
                                        </FieldLabel>
                                    </Field>
                                );
                            })}
                        </div>
                    </FieldSet>
                );
            }}
        />
    );
}
