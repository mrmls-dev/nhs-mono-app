"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, MapPinned, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@workspace/ui/components/button";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from "@workspace/ui/components/sheet";
import {
    Field,
    FieldError,
    FieldGroup,
    FieldLabel,
} from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@workspace/ui/components/select";
import {
    Empty,
    EmptyContent,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
    EmptyDescription,
} from "@workspace/ui/components/empty";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { getCounties, createCounty, deleteCounty, type County } from "@/api/county";
import { getRegions, type Region } from "@/api/region";
import { DeleteDialog } from "@/components/DeleteDialog";
import { ErrorDialog } from "@/components/ErrorDialog";

const toSlug = (v: string) =>
    v
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");

const boundsField = z
    .string()
    .min(1, "Required")
    .regex(/^-?\d+(\.\d+)?$/, "Must be a number")
    .transform(Number);

const countySchema = z.object({
    name: z.string().min(1, "Name is required"),
    slug: z
        .string()
        .min(1, "Slug is required")
        .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, and dashes only"),
    regionId: z.string().min(1, "Select a region"),
    boundsNorth: boundsField,
    boundsSouth: boundsField,
    boundsEast: boundsField,
    boundsWest: boundsField,
});

type CountyFormValues = z.input<typeof countySchema>;
type CountyFormOutput = z.output<typeof countySchema>;

export function CountiesClient() {
    const [sheetOpen, setSheetOpen] = useState(false);
    const [slugDirty, setSlugDirty] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const qc = useQueryClient();

    const { data: counties, isPending, isError } = useQuery<County[]>({
        queryKey: ["counties"],
        queryFn: getCounties,
    });

    const { data: regions } = useQuery<Region[]>({
        queryKey: ["regions"],
        queryFn: getRegions,
    });

    const createMutation = useMutation({
        mutationFn: createCounty,
        onSuccess: (created) => {
            qc.invalidateQueries({ queryKey: ["counties"] });
            toast.success(`"${created.name}" county created.`);
            setSheetOpen(false);
        },
        onError: (err: Error) => toast.error(err.message),
    });

    const deleteMutation = useMutation({
        mutationFn: deleteCounty,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["counties"] });
            toast.success("County deleted.");
            setDeleteTarget(null);
        },
        onError: (err: Error) => {
            setDeleteTarget(null);
            setErrorMessage(err.message);
        },
    });

    const {
        register,
        control,
        handleSubmit,
        watch,
        setValue,
        reset,
        formState: { errors },
    } = useForm<CountyFormValues, unknown, CountyFormOutput>({
        resolver: zodResolver(countySchema),
        defaultValues: {
            name: "",
            slug: "",
            regionId: "",
            boundsNorth: "",
            boundsSouth: "",
            boundsEast: "",
            boundsWest: "",
        },
    });

    const nameValue = watch("name") ?? "";

    useEffect(() => {
        if (!slugDirty) {
            setValue("slug", toSlug(nameValue), { shouldValidate: false });
        }
    }, [nameValue, slugDirty, setValue]);

    const onSubmit = (values: CountyFormOutput) => createMutation.mutate(values);

    const handleSheetOpenChange = (next: boolean) => {
        if (!next) {
            reset();
            setSlugDirty(false);
        }
        setSheetOpen(next);
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-2xl font-semibold tracking-tight">Counties</h1>
                <Button onClick={() => setSheetOpen(true)}>
                    <Plus data-icon="inline-start" />
                    Add County
                </Button>
            </div>

            {isPending ? (
                <div className="flex flex-col gap-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full rounded-lg" />
                    ))}
                </div>
            ) : isError ? (
                <p className="text-sm text-destructive">
                    Could not load counties. Make sure the API is running.
                </p>
            ) : counties && counties.length > 0 ? (
                <div className="overflow-hidden rounded-lg border">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-muted/50 text-left text-muted-foreground">
                                <th className="px-4 py-3 font-medium">Name</th>
                                <th className="px-4 py-3 font-medium">Slug</th>
                                <th className="px-4 py-3 font-medium">Region</th>
                                <th className="px-4 py-3 font-medium hidden sm:table-cell">
                                    Bounds (N / S / E / W)
                                </th>
                                <th className="px-4 py-3" />
                            </tr>
                        </thead>
                        <tbody>
                            {counties.map((c, i) => (
                                <tr
                                    key={c.id}
                                    className={
                                        i < counties.length - 1 ? "border-b" : ""
                                    }
                                >
                                    <td className="px-4 py-3 font-medium">
                                        <Link
                                            href={`/dashboard/counties/${c.slug}`}
                                            className="hover:text-primary hover:underline"
                                        >
                                            {c.name}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                                        {c.slug}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {c.region.name}
                                    </td>
                                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground hidden sm:table-cell">
                                        {c.boundsNorth} / {c.boundsSouth} /{" "}
                                        {c.boundsEast} / {c.boundsWest}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex justify-end">
                                            <Button
                                                size="icon-xs"
                                                variant="ghost"
                                                aria-label={`Delete ${c.name}`}
                                                onClick={() =>
                                                    setDeleteTarget({
                                                        id: c.id,
                                                        name: c.name,
                                                    })
                                                }
                                            >
                                                <Trash2 className="size-4 text-muted-foreground" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <Empty className="border border-dashed">
                    <EmptyHeader>
                        <EmptyMedia variant="icon">
                            <MapPinned />
                        </EmptyMedia>
                        <EmptyTitle>No counties yet</EmptyTitle>
                        <EmptyDescription>
                            Add your first county to organise communities by
                            geography.
                        </EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent>
                        <Button onClick={() => setSheetOpen(true)}>
                            <Plus data-icon="inline-start" />
                            Add County
                        </Button>
                    </EmptyContent>
                </Empty>
            )}

            {/* Add County sheet */}
            <Sheet open={sheetOpen} onOpenChange={handleSheetOpenChange}>
                <SheetContent side="right" className="overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>Add County</SheetTitle>
                        <SheetDescription>
                            Counties belong to a region and group communities on
                            the map.
                        </SheetDescription>
                    </SheetHeader>

                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="flex flex-col gap-4 px-4"
                        noValidate
                    >
                        <FieldGroup className="gap-4">
                            <Field data-invalid={errors.name ? true : undefined}>
                                <FieldLabel>Name</FieldLabel>
                                <Input
                                    placeholder="Palm Beach County"
                                    aria-invalid={errors.name ? true : undefined}
                                    {...register("name")}
                                />
                                {errors.name && (
                                    <FieldError
                                        errors={[{ message: errors.name.message }]}
                                    />
                                )}
                            </Field>

                            <Field data-invalid={errors.slug ? true : undefined}>
                                <FieldLabel>Slug</FieldLabel>
                                <Input
                                    placeholder="palm-beach-county"
                                    aria-invalid={errors.slug ? true : undefined}
                                    {...register("slug", {
                                        onChange: () => setSlugDirty(true),
                                    })}
                                />
                                {errors.slug && (
                                    <FieldError
                                        errors={[{ message: errors.slug.message }]}
                                    />
                                )}
                            </Field>

                            <Field
                                data-invalid={errors.regionId ? true : undefined}
                            >
                                <FieldLabel>Region</FieldLabel>
                                <Controller
                                    control={control}
                                    name="regionId"
                                    render={({ field }) => (
                                        <Select
                                            value={field.value}
                                            onValueChange={field.onChange}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a region" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectGroup>
                                                    {(regions ?? []).map((r) => (
                                                        <SelectItem
                                                            key={r.id}
                                                            value={r.id}
                                                        >
                                                            {r.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errors.regionId && (
                                    <FieldError
                                        errors={[
                                            { message: errors.regionId.message },
                                        ]}
                                    />
                                )}
                            </Field>

                            <div className="grid grid-cols-2 gap-3">
                                <Field
                                    data-invalid={
                                        errors.boundsNorth ? true : undefined
                                    }
                                >
                                    <FieldLabel>Bounds North</FieldLabel>
                                    <Input
                                        inputMode="decimal"
                                        placeholder="27.3"
                                        {...register("boundsNorth")}
                                    />
                                    {errors.boundsNorth && (
                                        <FieldError
                                            errors={[
                                                {
                                                    message:
                                                        errors.boundsNorth.message,
                                                },
                                            ]}
                                        />
                                    )}
                                </Field>
                                <Field
                                    data-invalid={
                                        errors.boundsSouth ? true : undefined
                                    }
                                >
                                    <FieldLabel>Bounds South</FieldLabel>
                                    <Input
                                        inputMode="decimal"
                                        placeholder="26.31"
                                        {...register("boundsSouth")}
                                    />
                                    {errors.boundsSouth && (
                                        <FieldError
                                            errors={[
                                                {
                                                    message:
                                                        errors.boundsSouth.message,
                                                },
                                            ]}
                                        />
                                    )}
                                </Field>
                                <Field
                                    data-invalid={
                                        errors.boundsEast ? true : undefined
                                    }
                                >
                                    <FieldLabel>Bounds East</FieldLabel>
                                    <Input
                                        inputMode="decimal"
                                        placeholder="-79.97"
                                        {...register("boundsEast")}
                                    />
                                    {errors.boundsEast && (
                                        <FieldError
                                            errors={[
                                                {
                                                    message:
                                                        errors.boundsEast.message,
                                                },
                                            ]}
                                        />
                                    )}
                                </Field>
                                <Field
                                    data-invalid={
                                        errors.boundsWest ? true : undefined
                                    }
                                >
                                    <FieldLabel>Bounds West</FieldLabel>
                                    <Input
                                        inputMode="decimal"
                                        placeholder="-80.89"
                                        {...register("boundsWest")}
                                    />
                                    {errors.boundsWest && (
                                        <FieldError
                                            errors={[
                                                {
                                                    message:
                                                        errors.boundsWest.message,
                                                },
                                            ]}
                                        />
                                    )}
                                </Field>
                            </div>
                        </FieldGroup>
                    </form>

                    <SheetFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleSheetOpenChange(false)}
                            disabled={createMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={createMutation.isPending}
                            onClick={handleSubmit(onSubmit)}
                        >
                            {createMutation.isPending && (
                                <Loader2
                                    data-icon="inline-start"
                                    className="animate-spin"
                                />
                            )}
                            Save County
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            {/* Delete confirmation dialog */}
            <DeleteDialog
                open={deleteTarget !== null}
                onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
                itemName={deleteTarget?.name ?? ""}
                isPending={deleteMutation.isPending}
                onConfirm={() => {
                    if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
                }}
            />

            {/* Error dialog */}
            <ErrorDialog
                open={errorMessage !== null}
                onOpenChange={(open) => { if (!open) setErrorMessage(null); }}
                message={errorMessage ?? ""}
            />
        </div>
    );
}
