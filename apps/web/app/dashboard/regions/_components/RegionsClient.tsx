"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Map, Loader2, Trash2 } from "lucide-react";
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
    Empty,
    EmptyContent,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
    EmptyDescription,
} from "@workspace/ui/components/empty";
import { Skeleton } from "@workspace/ui/components/skeleton";
import {
    getRegions,
    createRegion,
    deleteRegion,
    type Region,
} from "@/api/region";
import { DeleteDialog } from "@/components/DeleteDialog";
import { ErrorDialog } from "@/components/ErrorDialog";

const toSlug = (v: string) =>
    v
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");

const regionSchema = z.object({
    name: z.string().min(1, "Name is required"),
    slug: z
        .string()
        .min(1, "Slug is required")
        .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, and dashes only"),
    state: z.string().min(1, "State is required"),
});

type RegionFormValues = z.infer<typeof regionSchema>;

export function RegionsClient() {
    const [sheetOpen, setSheetOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [slugDirty, setSlugDirty] = useState(false);
    const qc = useQueryClient();

    const { data: regions, isPending, isError } = useQuery<Region[]>({
        queryKey: ["regions"],
        queryFn: getRegions,
    });

    const createMutation = useMutation({
        mutationFn: createRegion,
        onSuccess: (created) => {
            qc.invalidateQueries({ queryKey: ["regions"] });
            toast.success(`"${created.name}" region created.`);
            setSheetOpen(false);
        },
        onError: (err: Error) => toast.error(err.message),
    });

    const deleteMutation = useMutation({
        mutationFn: deleteRegion,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["regions"] });
            toast.success("Region deleted.");
            setDeleteTarget(null);
        },
        onError: (err: Error) => {
            setDeleteTarget(null);
            setErrorMessage(err.message);
        },
    });

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        reset,
        formState: { errors },
    } = useForm<RegionFormValues>({
        resolver: zodResolver(regionSchema),
        defaultValues: { name: "", slug: "", state: "Florida" },
    });

    const nameValue = watch("name");

    useEffect(() => {
        if (!slugDirty) {
            setValue("slug", toSlug(nameValue), { shouldValidate: false });
        }
    }, [nameValue, slugDirty, setValue]);

    const onSubmit = (values: RegionFormValues) => createMutation.mutate(values);

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
                <h1 className="text-2xl font-semibold tracking-tight">Regions</h1>
                <Button onClick={() => setSheetOpen(true)}>
                    <Plus data-icon="inline-start" />
                    Add Region
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
                    Could not load regions. Make sure the API is running.
                </p>
            ) : regions && regions.length > 0 ? (
                <div className="overflow-hidden rounded-lg border">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-muted/50 text-left text-muted-foreground">
                                <th className="px-4 py-3 font-medium">Name</th>
                                <th className="px-4 py-3 font-medium">Slug</th>
                                <th className="px-4 py-3 font-medium">State</th>
                                <th className="px-4 py-3 font-medium text-right">
                                    Counties
                                </th>
                                <th className="px-4 py-3" />
                            </tr>
                        </thead>
                        <tbody>
                            {regions.map((r, i) => (
                                <tr
                                    key={r.id}
                                    className={
                                        i < regions.length - 1 ? "border-b" : ""
                                    }
                                >
                                    <td className="px-4 py-3 font-medium">
                                        {r.name}
                                    </td>
                                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                                        {r.slug}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {r.state}
                                    </td>
                                    <td className="px-4 py-3 text-right text-muted-foreground">
                                        {r._count.counties}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex justify-end">
                                            <Button
                                                size="icon-xs"
                                                variant="ghost"
                                                aria-label={`Delete ${r.name}`}
                                                onClick={() =>
                                                    setDeleteTarget({
                                                        id: r.id,
                                                        name: r.name,
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
                            <Map />
                        </EmptyMedia>
                        <EmptyTitle>No regions yet</EmptyTitle>
                        <EmptyDescription>
                            Add your first region to start organising counties.
                        </EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent>
                        <Button onClick={() => setSheetOpen(true)}>
                            <Plus data-icon="inline-start" />
                            Add Region
                        </Button>
                    </EmptyContent>
                </Empty>
            )}

            {/* Add Region sheet */}
            <Sheet open={sheetOpen} onOpenChange={handleSheetOpenChange}>
                <SheetContent side="right" className="overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>Add Region</SheetTitle>
                        <SheetDescription>
                            Regions group counties under a geographic label.
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
                                    placeholder="Southeast Florida"
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
                                    placeholder="southeast-florida"
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

                            <Field data-invalid={errors.state ? true : undefined}>
                                <FieldLabel>State</FieldLabel>
                                <Input
                                    placeholder="Florida"
                                    aria-invalid={errors.state ? true : undefined}
                                    {...register("state")}
                                />
                                {errors.state && (
                                    <FieldError
                                        errors={[{ message: errors.state.message }]}
                                    />
                                )}
                            </Field>
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
                            Save Region
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
