"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Pencil, Plus, Trash2, Loader2, Building2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
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
import { getCounty, updateCounty, deleteCounty } from "@/api/county";
import { deleteCommunity } from "@/api/community";
import { SPEC_PLACEHOLDER } from "@/lib/format";
import { DeleteDialog } from "@/components/DeleteDialog";
import { ErrorDialog } from "@/components/ErrorDialog";

const STATUS_LABEL: Record<string, string> = {
    NOW_SELLING: "Now Selling",
    COMING_SOON: "Coming Soon",
    SOLD_OUT: "Sold Out",
};
const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
    NOW_SELLING: "default",
    COMING_SOON: "secondary",
    SOLD_OUT: "outline",
};

const fmt = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
});

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

export function CountyDetailClient({ slug }: { slug: string }) {
    const router = useRouter();
    const qc = useQueryClient();
    const [editOpen, setEditOpen] = useState(false);
    const [deleteCountyOpen, setDeleteCountyOpen] = useState(false);
    const [deleteCommunityTarget, setDeleteCommunityTarget] = useState<{
        id: string;
        name: string;
    } | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const {
        data: county,
        isPending,
        isError,
    } = useQuery({
        queryKey: ["county", slug],
        queryFn: () => getCounty(slug),
    });

    const invalidate = () => {
        qc.invalidateQueries({ queryKey: ["county", slug] });
        qc.invalidateQueries({ queryKey: ["counties"] });
        qc.invalidateQueries({ queryKey: ["communities"] });
    };

    const editForm = useForm<CountyFormValues, unknown, CountyFormOutput>({
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

    useEffect(() => {
        if (county) {
            editForm.reset({
                name: county.name,
                slug: county.slug,
                boundsNorth: String(county.boundsNorth),
                boundsSouth: String(county.boundsSouth),
                boundsEast: String(county.boundsEast),
                boundsWest: String(county.boundsWest),
            });
        }
    }, [county, editForm]);

    const updateMutation = useMutation({
        mutationFn: (values: CountyFormOutput) =>
            updateCounty(county!.id, values),
        onSuccess: (updated) => {
            invalidate();
            toast.success(`"${updated.name}" updated.`);
            setEditOpen(false);
            if (updated.slug !== slug) {
                router.replace(`/dashboard/counties/${updated.slug}`);
            }
        },
        onError: (err: Error) => toast.error(err.message),
    });

    const deleteCountyMutation = useMutation({
        mutationFn: () => deleteCounty(county!.id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["counties"] });
            toast.success("County deleted.");
            router.push("/dashboard/counties");
        },
        onError: (err: Error) => {
            setDeleteCountyOpen(false);
            setErrorMessage(err.message);
        },
    });

    const deleteCommunityMutation = useMutation({
        mutationFn: deleteCommunity,
        onSuccess: () => {
            invalidate();
            toast.success("Community deleted.");
            setDeleteCommunityTarget(null);
        },
        onError: (err: Error) => {
            setDeleteCommunityTarget(null);
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

    if (isError || !county) {
        return (
            <div className="flex flex-col gap-4">
                <Button variant="ghost" size="sm" asChild className="w-fit">
                    <Link href="/dashboard/counties">
                        <ArrowLeft data-icon="inline-start" />
                        Back to counties
                    </Link>
                </Button>
                <p className="text-sm text-destructive">
                    Could not load this county.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <Button variant="ghost" size="sm" asChild className="w-fit">
                <Link href={`/dashboard/regions/${county.region.slug}`}>
                    <ArrowLeft data-icon="inline-start" />
                    {county.region.name}
                </Link>
            </Button>

            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        {county.name}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        <span className="font-mono">{county.slug}</span> · bounds{" "}
                        {county.boundsNorth} / {county.boundsSouth} /{" "}
                        {county.boundsEast} / {county.boundsWest}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => setEditOpen(true)}>
                        <Pencil data-icon="inline-start" />
                        Edit
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => setDeleteCountyOpen(true)}
                    >
                        <Trash2 data-icon="inline-start" />
                        Delete
                    </Button>
                </div>
            </div>

            {/* Communities */}
            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Communities</h2>
                    <Button size="sm" asChild>
                        <Link
                            href={`/dashboard/communities/new?county=${county.id}`}
                        >
                            <Plus data-icon="inline-start" />
                            Add Community
                        </Link>
                    </Button>
                </div>

                {county.communities.length > 0 ? (
                    <div className="overflow-hidden rounded-lg border">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/50 text-left text-muted-foreground">
                                    <th className="px-4 py-3 font-medium">
                                        Name
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 font-medium text-right hidden sm:table-cell">
                                        Price from
                                    </th>
                                    <th className="px-4 py-3 font-medium text-right hidden md:table-cell">
                                        Plans
                                    </th>
                                    <th className="px-4 py-3" />
                                </tr>
                            </thead>
                            <tbody>
                                {county.communities.map((c, i) => (
                                    <tr
                                        key={c.id}
                                        className={
                                            i < county.communities.length - 1
                                                ? "border-b"
                                                : ""
                                        }
                                    >
                                        <td className="px-4 py-3">
                                            <Link
                                                href={`/dashboard/communities/${c.slug}`}
                                                className="font-medium hover:text-primary hover:underline"
                                            >
                                                {c.name}
                                            </Link>
                                            <div className="font-mono text-xs text-muted-foreground">
                                                {c.slug}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge
                                                variant={
                                                    STATUS_VARIANT[c.status]
                                                }
                                            >
                                                {STATUS_LABEL[c.status]}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-right text-muted-foreground hidden sm:table-cell">
                                            {c._count.floorPlans > 0
                                                ? fmt.format(c.priceFrom)
                                                : SPEC_PLACEHOLDER}
                                        </td>
                                        <td className="px-4 py-3 text-right text-muted-foreground hidden md:table-cell">
                                            {c._count.floorPlans}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end">
                                                <Button
                                                    size="icon-xs"
                                                    variant="ghost"
                                                    aria-label={`Delete ${c.name}`}
                                                    onClick={() =>
                                                        setDeleteCommunityTarget(
                                                            {
                                                                id: c.id,
                                                                name: c.name,
                                                            },
                                                        )
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
                                <Building2 />
                            </EmptyMedia>
                            <EmptyTitle>No communities yet</EmptyTitle>
                            <EmptyDescription>
                                Add a community to this county.
                            </EmptyDescription>
                        </EmptyHeader>
                    </Empty>
                )}
            </div>

            {/* Edit county sheet */}
            <Sheet open={editOpen} onOpenChange={setEditOpen}>
                <SheetContent side="right" className="overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>Edit County</SheetTitle>
                        <SheetDescription>
                            Update this county&apos;s details.
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
                            <div className="grid grid-cols-2 gap-3">
                                {(
                                    [
                                        ["boundsNorth", "Bounds North"],
                                        ["boundsSouth", "Bounds South"],
                                        ["boundsEast", "Bounds East"],
                                        ["boundsWest", "Bounds West"],
                                    ] as const
                                ).map(([name, label]) => (
                                    <Field
                                        key={name}
                                        data-invalid={
                                            editForm.formState.errors[name]
                                                ? true
                                                : undefined
                                        }
                                    >
                                        <FieldLabel>{label}</FieldLabel>
                                        <Input
                                            inputMode="decimal"
                                            {...editForm.register(name)}
                                        />
                                        {editForm.formState.errors[name] && (
                                            <FieldError
                                                errors={[
                                                    {
                                                        message:
                                                            editForm.formState
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

            <DeleteDialog
                open={deleteCountyOpen}
                onOpenChange={(open) => {
                    if (!open) setDeleteCountyOpen(false);
                }}
                itemName={county.name}
                isPending={deleteCountyMutation.isPending}
                onConfirm={() => deleteCountyMutation.mutate()}
            />

            <DeleteDialog
                open={deleteCommunityTarget !== null}
                onOpenChange={(open) => {
                    if (!open) setDeleteCommunityTarget(null);
                }}
                itemName={deleteCommunityTarget?.name ?? ""}
                isPending={deleteCommunityMutation.isPending}
                onConfirm={() => {
                    if (deleteCommunityTarget)
                        deleteCommunityMutation.mutate(
                            deleteCommunityTarget.id,
                        );
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
