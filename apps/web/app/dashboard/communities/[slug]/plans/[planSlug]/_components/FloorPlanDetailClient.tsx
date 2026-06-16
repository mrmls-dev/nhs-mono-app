"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { FloorPlanForm } from "@/app/dashboard/communities/_components/FloorPlanForm";
import type {
    FloorPlanFormOutput,
    FloorPlanFormValues,
} from "@/app/dashboard/communities/_components/floor-plan-schema";
import {
    getFloorPlan,
    updateFloorPlan,
    deleteFloorPlan,
    type FloorPlanDetail,
} from "@/api/floor-plan";
import { DeleteDialog } from "@/components/DeleteDialog";
import { ErrorDialog } from "@/components/ErrorDialog";

const fmt = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
});

function toFormValues(plan: FloorPlanDetail): FloorPlanFormValues {
    return {
        slug: plan.slug,
        name: plan.name,
        brand: plan.brand ?? "",
        startingPrice: String(plan.startingPrice),
        beds: String(plan.beds),
        baths: String(plan.baths),
        garage: String(plan.garage),
        stories: String(plan.stories),
        sqft: String(plan.sqft),
        image: plan.image,
        modelVideo: plan.modelVideo ?? "",
        description: plan.description ?? "",
        diagramImage: plan.diagramImage ?? "",
        gallery: plan.gallery.map((m) => ({
            src: m.src,
            alt: m.alt,
            caption: m.caption ?? "",
        })),
    };
}

export function FloorPlanDetailClient({
    communitySlug,
    planSlug,
}: {
    communitySlug: string;
    planSlug: string;
}) {
    const router = useRouter();
    const qc = useQueryClient();
    const [editing, setEditing] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const {
        data: plan,
        isPending,
        isError,
    } = useQuery({
        queryKey: ["floor-plan", communitySlug, planSlug],
        queryFn: () => getFloorPlan(communitySlug, planSlug),
    });

    const deleteMutation = useMutation({
        mutationFn: () => deleteFloorPlan(plan!.id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["community", communitySlug] });
            toast.success("Floor plan deleted.");
            router.push(`/dashboard/communities/${communitySlug}`);
        },
        onError: (err: Error) => {
            setDeleteOpen(false);
            setErrorMessage(err.message);
        },
    });

    const onUpdate = async (values: FloorPlanFormOutput) => {
        const updated = await updateFloorPlan(plan!.id, values);
        qc.invalidateQueries({ queryKey: ["community", communitySlug] });
        toast.success("Floor plan updated.");
        setEditing(false);
        if (updated.slug !== planSlug) {
            router.replace(
                `/dashboard/communities/${communitySlug}/plans/${updated.slug}`,
            );
        } else {
            qc.invalidateQueries({
                queryKey: ["floor-plan", communitySlug, planSlug],
            });
        }
    };

    if (isPending) {
        return (
            <div className="flex flex-col gap-4">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-64 w-full rounded-lg" />
            </div>
        );
    }

    if (isError || !plan) {
        return (
            <div className="flex flex-col gap-4">
                <Button variant="ghost" size="sm" asChild className="w-fit">
                    <Link href={`/dashboard/communities/${communitySlug}`}>
                        <ArrowLeft data-icon="inline-start" />
                        Back to community
                    </Link>
                </Button>
                <p className="text-sm text-destructive">
                    Could not load this floor plan.
                </p>
            </div>
        );
    }

    const images = plan.gallery;

    return (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
            <Button variant="ghost" size="sm" asChild className="w-fit">
                <Link href={`/dashboard/communities/${plan.community.slug}`}>
                    <ArrowLeft data-icon="inline-start" />
                    {plan.community.name}
                </Link>
            </Button>

            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        {plan.name}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        <span className="font-mono">{plan.slug}</span>
                        {plan.brand ? ` · ${plan.brand}` : ""}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {editing ? (
                        <Button
                            variant="outline"
                            onClick={() => setEditing(false)}
                        >
                            <X data-icon="inline-start" />
                            Cancel
                        </Button>
                    ) : (
                        <>
                            <Button
                                variant="outline"
                                onClick={() => setEditing(true)}
                            >
                                <Pencil data-icon="inline-start" />
                                Edit
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setDeleteOpen(true)}
                            >
                                <Trash2 data-icon="inline-start" />
                                Delete
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {editing ? (
                <FloorPlanForm
                    communitySlug={communitySlug}
                    defaultValues={toFormValues(plan)}
                    submitLabel="Save changes"
                    onSubmit={onUpdate}
                />
            ) : (
                <div className="flex flex-col gap-6">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                        <Badge variant="secondary">
                            {fmt.format(plan.startingPrice)}
                        </Badge>
                        <span className="text-muted-foreground">
                            {plan.beds} bd · {Number(plan.baths)} ba ·{" "}
                            {plan.garage} garage · {plan.stories} stories ·{" "}
                            {Number(plan.sqft).toLocaleString()} sq ft
                        </span>
                    </div>

                    {plan.description && (
                        <p className="text-sm text-foreground whitespace-pre-line">
                            {plan.description}
                        </p>
                    )}

                    {plan.modelVideo && (
                        <a
                            href={plan.modelVideo}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm font-medium text-primary hover:underline"
                        >
                            View model video
                        </a>
                    )}

                    {images.length > 0 && (
                        <div className="flex flex-col gap-2">
                            <h2 className="text-lg font-semibold">Gallery</h2>
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                {images.map((m) => (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        key={m.src}
                                        src={m.src}
                                        alt={m.alt}
                                        className="aspect-square w-full rounded-lg border object-cover"
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {plan.diagramImage && (
                        <div className="flex flex-col gap-2">
                            <h2 className="text-lg font-semibold">Diagram</h2>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={plan.diagramImage}
                                alt={`${plan.name} diagram`}
                                className="w-full rounded-lg border object-contain"
                            />
                        </div>
                    )}
                </div>
            )}

            <DeleteDialog
                open={deleteOpen}
                onOpenChange={(open) => {
                    if (!open) setDeleteOpen(false);
                }}
                itemName={plan.name}
                isPending={deleteMutation.isPending}
                onConfirm={() => deleteMutation.mutate()}
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
