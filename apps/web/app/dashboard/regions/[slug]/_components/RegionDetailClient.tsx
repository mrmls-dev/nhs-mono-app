"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Pencil, Plus, Trash2, Loader2, MapPinned } from "lucide-react";
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
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "@workspace/ui/components/empty";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { getRegion, updateRegion, deleteRegion } from "@/api/region";
import { createCounty, deleteCounty } from "@/api/county";
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
    boundsNorth: boundsField,
    boundsSouth: boundsField,
    boundsEast: boundsField,
    boundsWest: boundsField,
});
type CountyFormValues = z.input<typeof countySchema>;
type CountyFormOutput = z.output<typeof countySchema>;

export function RegionDetailClient({ slug }: { slug: string }) {
    const router = useRouter();
    const qc = useQueryClient();
    const [editOpen, setEditOpen] = useState(false);
    const [addCountyOpen, setAddCountyOpen] = useState(false);
    const [slugDirty, setSlugDirty] = useState(false);
    const [deleteRegionOpen, setDeleteRegionOpen] = useState(false);
    const [deleteCountyTarget, setDeleteCountyTarget] = useState<{
        id: string;
        name: string;
    } | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const {
        data: region,
        isPending,
        isError,
    } = useQuery({
        queryKey: ["region", slug],
        queryFn: () => getRegion(slug),
    });

    const invalidate = () => {
        qc.invalidateQueries({ queryKey: ["region", slug] });
        qc.invalidateQueries({ queryKey: ["regions"] });
        qc.invalidateQueries({ queryKey: ["counties"] });
    };

    // ── Edit region ──────────────────────────────────────────────────────
    const editForm = useForm<RegionFormValues>({
        resolver: zodResolver(regionSchema),
        defaultValues: { name: "", slug: "", state: "Florida" },
    });

    useEffect(() => {
        if (region) {
            editForm.reset({
                name: region.name,
                slug: region.slug,
                state: region.state,
            });
        }
    }, [region, editForm]);

    const updateMutation = useMutation({
        mutationFn: (values: RegionFormValues) =>
            updateRegion(region!.id, values),
        onSuccess: (updated) => {
            invalidate();
            toast.success(`"${updated.name}" updated.`);
            setEditOpen(false);
            if (updated.slug !== slug) {
                router.replace(`/dashboard/regions/${updated.slug}`);
            }
        },
        onError: (err: Error) => toast.error(err.message),
    });

    const deleteRegionMutation = useMutation({
        mutationFn: () => deleteRegion(region!.id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["regions"] });
            toast.success("Region deleted.");
            router.push("/dashboard/regions");
        },
        onError: (err: Error) => {
            setDeleteRegionOpen(false);
            setErrorMessage(err.message);
        },
    });

    // ── Add county ───────────────────────────────────────────────────────
    const countyForm = useForm<CountyFormValues, unknown, CountyFormOutput>({
        resolver: zodResolver(countySchema),
        defaultValues: {
            name: "",
            slug: "",
            boundsNorth: "",
            boundsSouth: "",
            boundsEast: "",
            boundsWest: "",
        },
    });

    const countyName = countyForm.watch("name") ?? "";
    useEffect(() => {
        if (!slugDirty) {
            countyForm.setValue("slug", toSlug(countyName), {
                shouldValidate: false,
            });
        }
    }, [countyName, slugDirty, countyForm]);

    const createCountyMutation = useMutation({
        mutationFn: (values: CountyFormOutput) =>
            createCounty({ ...values, regionId: region!.id }),
        onSuccess: (created) => {
            invalidate();
            toast.success(`"${created.name}" county created.`);
            setAddCountyOpen(false);
            countyForm.reset();
            setSlugDirty(false);
        },
        onError: (err: Error) => toast.error(err.message),
    });

    const deleteCountyMutation = useMutation({
        mutationFn: deleteCounty,
        onSuccess: () => {
            invalidate();
            toast.success("County deleted.");
            setDeleteCountyTarget(null);
        },
        onError: (err: Error) => {
            setDeleteCountyTarget(null);
            setErrorMessage(err.message);
        },
    });

    if (isPending) {
        return (
            <div className="flex flex-col gap-4">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-40 w-full rounded-lg" />
            </div>
        );
    }

    if (isError || !region) {
        return (
            <div className="flex flex-col gap-4">
                <Button variant="ghost" size="sm" asChild className="w-fit">
                    <Link href="/dashboard/regions">
                        <ArrowLeft data-icon="inline-start" />
                        Back to regions
                    </Link>
                </Button>
                <p className="text-sm text-destructive">
                    Could not load this region.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <Button variant="ghost" size="sm" asChild className="w-fit">
                <Link href="/dashboard/regions">
                    <ArrowLeft data-icon="inline-start" />
                    Back to regions
                </Link>
            </Button>

            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        {region.name}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        <span className="font-mono">{region.slug}</span> ·{" "}
                        {region.state}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => setEditOpen(true)}>
                        <Pencil data-icon="inline-start" />
                        Edit
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => setDeleteRegionOpen(true)}
                    >
                        <Trash2 data-icon="inline-start" />
                        Delete
                    </Button>
                </div>
            </div>

            {/* Counties */}
            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Counties</h2>
                    <Button size="sm" onClick={() => setAddCountyOpen(true)}>
                        <Plus data-icon="inline-start" />
                        Add County
                    </Button>
                </div>

                {region.counties.length > 0 ? (
                    <div className="overflow-hidden rounded-lg border">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/50 text-left text-muted-foreground">
                                    <th className="px-4 py-3 font-medium">
                                        Name
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Slug
                                    </th>
                                    <th className="px-4 py-3 font-medium text-right">
                                        Communities
                                    </th>
                                    <th className="px-4 py-3" />
                                </tr>
                            </thead>
                            <tbody>
                                {region.counties.map((c, i) => (
                                    <tr
                                        key={c.id}
                                        className={
                                            i < region.counties.length - 1
                                                ? "border-b"
                                                : ""
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
                                        <td className="px-4 py-3 text-right text-muted-foreground">
                                            {c._count.communities}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end">
                                                <Button
                                                    size="icon-xs"
                                                    variant="ghost"
                                                    aria-label={`Delete ${c.name}`}
                                                    onClick={() =>
                                                        setDeleteCountyTarget({
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
                                Add a county to this region.
                            </EmptyDescription>
                        </EmptyHeader>
                    </Empty>
                )}
            </div>

            {/* Edit region sheet */}
            <Sheet open={editOpen} onOpenChange={setEditOpen}>
                <SheetContent side="right" className="overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>Edit Region</SheetTitle>
                        <SheetDescription>
                            Update this region&apos;s details.
                        </SheetDescription>
                    </SheetHeader>
                    <form
                        onSubmit={editForm.handleSubmit((v) =>
                            updateMutation.mutate(v),
                        )}
                        className="flex flex-col gap-4 px-4"
                        noValidate
                    >
                        <FieldGroup className="gap-4">
                            <Field
                                data-invalid={
                                    editForm.formState.errors.name
                                        ? true
                                        : undefined
                                }
                            >
                                <FieldLabel>Name</FieldLabel>
                                <Input {...editForm.register("name")} />
                                {editForm.formState.errors.name && (
                                    <FieldError
                                        errors={[
                                            {
                                                message:
                                                    editForm.formState.errors
                                                        .name.message,
                                            },
                                        ]}
                                    />
                                )}
                            </Field>
                            <Field
                                data-invalid={
                                    editForm.formState.errors.slug
                                        ? true
                                        : undefined
                                }
                            >
                                <FieldLabel>Slug</FieldLabel>
                                <Input {...editForm.register("slug")} />
                                {editForm.formState.errors.slug && (
                                    <FieldError
                                        errors={[
                                            {
                                                message:
                                                    editForm.formState.errors
                                                        .slug.message,
                                            },
                                        ]}
                                    />
                                )}
                            </Field>
                            <Field
                                data-invalid={
                                    editForm.formState.errors.state
                                        ? true
                                        : undefined
                                }
                            >
                                <FieldLabel>State</FieldLabel>
                                <Input {...editForm.register("state")} />
                            </Field>
                        </FieldGroup>
                    </form>
                    <SheetFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setEditOpen(false)}
                            disabled={updateMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={editForm.handleSubmit((v) =>
                                updateMutation.mutate(v),
                            )}
                            disabled={updateMutation.isPending}
                        >
                            {updateMutation.isPending && (
                                <Loader2
                                    data-icon="inline-start"
                                    className="animate-spin"
                                />
                            )}
                            Save changes
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            {/* Add county sheet */}
            <Sheet
                open={addCountyOpen}
                onOpenChange={(next) => {
                    if (!next) {
                        countyForm.reset();
                        setSlugDirty(false);
                    }
                    setAddCountyOpen(next);
                }}
            >
                <SheetContent side="right" className="overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>Add County</SheetTitle>
                        <SheetDescription>
                            New county in {region.name}.
                        </SheetDescription>
                    </SheetHeader>
                    <form
                        onSubmit={countyForm.handleSubmit((v) =>
                            createCountyMutation.mutate(v),
                        )}
                        className="flex flex-col gap-4 px-4"
                        noValidate
                    >
                        <FieldGroup className="gap-4">
                            <Field
                                data-invalid={
                                    countyForm.formState.errors.name
                                        ? true
                                        : undefined
                                }
                            >
                                <FieldLabel>Name</FieldLabel>
                                <Input
                                    placeholder="Palm Beach County"
                                    {...countyForm.register("name")}
                                />
                                {countyForm.formState.errors.name && (
                                    <FieldError
                                        errors={[
                                            {
                                                message:
                                                    countyForm.formState.errors
                                                        .name.message,
                                            },
                                        ]}
                                    />
                                )}
                            </Field>
                            <Field
                                data-invalid={
                                    countyForm.formState.errors.slug
                                        ? true
                                        : undefined
                                }
                            >
                                <FieldLabel>Slug</FieldLabel>
                                <Input
                                    placeholder="palm-beach-county"
                                    {...countyForm.register("slug", {
                                        onChange: () => setSlugDirty(true),
                                    })}
                                />
                                {countyForm.formState.errors.slug && (
                                    <FieldError
                                        errors={[
                                            {
                                                message:
                                                    countyForm.formState.errors
                                                        .slug.message,
                                            },
                                        ]}
                                    />
                                )}
                            </Field>
                            <div className="grid grid-cols-2 gap-3">
                                {(
                                    [
                                        ["boundsNorth", "Bounds North", "27.3"],
                                        ["boundsSouth", "Bounds South", "26.31"],
                                        ["boundsEast", "Bounds East", "-79.97"],
                                        ["boundsWest", "Bounds West", "-80.89"],
                                    ] as const
                                ).map(([name, label, ph]) => (
                                    <Field
                                        key={name}
                                        data-invalid={
                                            countyForm.formState.errors[name]
                                                ? true
                                                : undefined
                                        }
                                    >
                                        <FieldLabel>{label}</FieldLabel>
                                        <Input
                                            inputMode="decimal"
                                            placeholder={ph}
                                            {...countyForm.register(name)}
                                        />
                                        {countyForm.formState.errors[name] && (
                                            <FieldError
                                                errors={[
                                                    {
                                                        message:
                                                            countyForm.formState
                                                                .errors[name]
                                                                ?.message,
                                                    },
                                                ]}
                                            />
                                        )}
                                    </Field>
                                ))}
                            </div>
                        </FieldGroup>
                    </form>
                    <SheetFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setAddCountyOpen(false)}
                            disabled={createCountyMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={countyForm.handleSubmit((v) =>
                                createCountyMutation.mutate(v),
                            )}
                            disabled={createCountyMutation.isPending}
                        >
                            {createCountyMutation.isPending && (
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

            <DeleteDialog
                open={deleteRegionOpen}
                onOpenChange={(open) => {
                    if (!open) setDeleteRegionOpen(false);
                }}
                itemName={region.name}
                isPending={deleteRegionMutation.isPending}
                onConfirm={() => deleteRegionMutation.mutate()}
            />

            <DeleteDialog
                open={deleteCountyTarget !== null}
                onOpenChange={(open) => {
                    if (!open) setDeleteCountyTarget(null);
                }}
                itemName={deleteCountyTarget?.name ?? ""}
                isPending={deleteCountyMutation.isPending}
                onConfirm={() => {
                    if (deleteCountyTarget)
                        deleteCountyMutation.mutate(deleteCountyTarget.id);
                }}
            />

            <ErrorDialog
                open={errorMessage !== null}
                onOpenChange={(open) => {
                    if (!open) setErrorMessage(null);
                }}
                message={errorMessage ?? ""}
            />
        </div>
    );
}
