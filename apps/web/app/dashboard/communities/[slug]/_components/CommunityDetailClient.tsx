"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    ArrowLeft,
    Pencil,
    Plus,
    Trash2,
    LayoutTemplate,
    Eye,
    EyeOff,
    Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import { Skeleton } from "@workspace/ui/components/skeleton";
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "@workspace/ui/components/empty";
import {
    getCommunity,
    deleteCommunity,
    publishCommunity,
} from "@/api/community";
import { deleteFloorPlan } from "@/api/floor-plan";
import { DeleteDialog } from "@/components/DeleteDialog";
import { ErrorDialog } from "@/components/ErrorDialog";

const STATUS_LABEL: Record<string, string> = {
    NOW_SELLING: "Now Selling",
    COMING_SOON: "Coming Soon",
    SOLD_OUT: "Sold Out",
};

const fmt = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
});

export function CommunityDetailClient({ slug }: { slug: string }) {
    const router = useRouter();
    const qc = useQueryClient();
    const [deleteCommunityOpen, setDeleteCommunityOpen] = useState(false);
    const [deletePlanTarget, setDeletePlanTarget] = useState<{
        id: string;
        name: string;
    } | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const {
        data: community,
        isPending,
        isError,
    } = useQuery({
        queryKey: ["community", slug],
        queryFn: () => getCommunity(slug),
    });

    const deleteCommunityMutation = useMutation({
        mutationFn: () => deleteCommunity(community!.id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["communities"] });
            toast.success("Community deleted.");
            router.push("/dashboard/communities");
        },
        onError: (err: Error) => {
            setDeleteCommunityOpen(false);
            setErrorMessage(err.message);
        },
    });

    const publishMutation = useMutation({
        mutationFn: (next: boolean) => publishCommunity(community!.id, next),
        onSuccess: (_data, next) => {
            qc.invalidateQueries({ queryKey: ["community", slug] });
            qc.invalidateQueries({ queryKey: ["communities"] });
            toast.success(next ? "Community published." : "Community unpublished.");
        },
        onError: (err: Error) => setErrorMessage(err.message),
    });

    const deletePlanMutation = useMutation({
        mutationFn: (id: string) => deleteFloorPlan(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["community", slug] });
            toast.success("Floor plan deleted.");
            setDeletePlanTarget(null);
        },
        onError: (err: Error) => {
            setDeletePlanTarget(null);
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

    if (isError || !community) {
        return (
            <div className="flex flex-col gap-4">
                <Button variant="ghost" size="sm" asChild className="w-fit">
                    <Link href="/dashboard/communities">
                        <ArrowLeft data-icon="inline-start" />
                        Back to communities
                    </Link>
                </Button>
                <p className="text-sm text-destructive">
                    Could not load this community.
                </p>
            </div>
        );
    }

    const amenityNames = community.amenities.map((a) => a.amenity.name);

    return (
        <div className="flex flex-col gap-6">
            <Button variant="ghost" size="sm" asChild className="w-fit">
                <Link href={`/dashboard/counties/${community.county.slug}`}>
                    <ArrowLeft data-icon="inline-start" />
                    {community.county.name}
                </Link>
            </Button>

            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-semibold tracking-tight">
                            {community.name}
                        </h1>
                        {community.published ? (
                            <Badge variant="default">Published</Badge>
                        ) : (
                            <Badge
                                variant="outline"
                                className="border-amber-500/50 text-amber-600 dark:text-amber-400"
                            >
                                Draft
                            </Badge>
                        )}
                        <Badge variant="secondary">
                            {STATUS_LABEL[community.status] ??
                                community.status}
                        </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        <span className="font-mono">{community.slug}</span> ·{" "}
                        {community.location}
                    </p>
                    {!community.published && (
                        <p className="text-xs text-muted-foreground">
                            This community is a draft and isn&rsquo;t visible on
                            any public site yet.
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant={community.published ? "outline" : "default"}
                        onClick={() =>
                            publishMutation.mutate(!community.published)
                        }
                        disabled={publishMutation.isPending}
                    >
                        {publishMutation.isPending ? (
                            <Loader2
                                data-icon="inline-start"
                                className="animate-spin"
                            />
                        ) : community.published ? (
                            <EyeOff data-icon="inline-start" />
                        ) : (
                            <Eye data-icon="inline-start" />
                        )}
                        {community.published ? "Unpublish" : "Publish"}
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href={`/dashboard/communities/${slug}/edit`}>
                            <Pencil data-icon="inline-start" />
                            Edit
                        </Link>
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => setDeleteCommunityOpen(true)}
                    >
                        <Trash2 data-icon="inline-start" />
                        Delete
                    </Button>
                </div>
            </div>

            {/* Summary */}
            <div className="grid gap-4 rounded-lg border p-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <Stat label="Price from" value={fmt.format(community.priceFrom)} />
                <Stat
                    label="Beds"
                    value={`${community.bedsMin}–${community.bedsMax}`}
                />
                <Stat
                    label="Baths"
                    value={`${community.bathsMin}–${community.bathsMax}`}
                />
                <Stat
                    label="Sq. ft. from"
                    value={community.sqftFrom.toLocaleString()}
                />
            </div>

            {community.about && (
                <p className="text-sm text-foreground whitespace-pre-line">
                    {community.about}
                </p>
            )}

            {/* Amenities */}
            <div className="flex flex-col gap-2">
                <h2 className="text-lg font-semibold">Amenities</h2>
                {amenityNames.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {amenityNames.map((a) => (
                            <Badge key={a} variant="secondary">
                                {a}
                            </Badge>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">
                        No amenities listed.
                    </p>
                )}
            </div>

            {/* Schools */}
            <div className="flex flex-col gap-2">
                <h2 className="text-lg font-semibold">Schools</h2>
                {community.schools.length > 0 ? (
                    <ul className="flex flex-col gap-1 text-sm">
                        {community.schools.map((s) => (
                            <li key={s.name} className="text-muted-foreground">
                                <span className="text-foreground font-medium">
                                    {s.name}
                                </span>{" "}
                                — {s.type} · {s.grades} · {s.distance}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-muted-foreground">
                        No schools listed.
                    </p>
                )}
            </div>

            {/* Floor plans */}
            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Floor Plans</h2>
                    <Button size="sm" asChild>
                        <Link
                            href={`/dashboard/communities/${slug}/plans/new`}
                        >
                            <Plus data-icon="inline-start" />
                            Add floor plan
                        </Link>
                    </Button>
                </div>

                {community.floorPlans.length > 0 ? (
                    <div className="overflow-hidden rounded-lg border">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/50 text-left text-muted-foreground">
                                    <th className="px-4 py-3 font-medium">
                                        Name
                                    </th>
                                    <th className="px-4 py-3 font-medium text-right">
                                        Price
                                    </th>
                                    <th className="px-4 py-3 font-medium text-right hidden sm:table-cell">
                                        Beds / Baths
                                    </th>
                                    <th className="px-4 py-3 font-medium text-right hidden md:table-cell">
                                        Sq. ft.
                                    </th>
                                    <th className="px-4 py-3" />
                                </tr>
                            </thead>
                            <tbody>
                                {community.floorPlans.map((p, i) => (
                                    <tr
                                        key={p.id}
                                        className={
                                            i < community.floorPlans.length - 1
                                                ? "border-b"
                                                : ""
                                        }
                                    >
                                        <td className="px-4 py-3">
                                            <Link
                                                href={`/dashboard/communities/${slug}/plans/${p.slug}`}
                                                className="font-medium hover:text-primary hover:underline"
                                            >
                                                {p.name}
                                            </Link>
                                            <div className="font-mono text-xs text-muted-foreground">
                                                {p.slug}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right text-muted-foreground">
                                            {fmt.format(p.startingPrice)}
                                        </td>
                                        <td className="px-4 py-3 text-right text-muted-foreground hidden sm:table-cell">
                                            {p.beds} / {Number(p.baths)}
                                        </td>
                                        <td className="px-4 py-3 text-right text-muted-foreground hidden md:table-cell">
                                            {Number(p.sqft).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end">
                                                <Button
                                                    size="icon-xs"
                                                    variant="ghost"
                                                    aria-label={`Delete ${p.name}`}
                                                    onClick={() =>
                                                        setDeletePlanTarget({
                                                            id: p.id,
                                                            name: p.name,
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
                                <LayoutTemplate />
                            </EmptyMedia>
                            <EmptyTitle>No floor plans yet</EmptyTitle>
                            <EmptyDescription>
                                Add the floor plans available in this community.
                            </EmptyDescription>
                        </EmptyHeader>
                    </Empty>
                )}
            </div>

            <DeleteDialog
                open={deleteCommunityOpen}
                onOpenChange={(open) => {
                    if (!open) setDeleteCommunityOpen(false);
                }}
                itemName={community.name}
                isPending={deleteCommunityMutation.isPending}
                onConfirm={() => deleteCommunityMutation.mutate()}
            />

            <DeleteDialog
                open={deletePlanTarget !== null}
                onOpenChange={(open) => {
                    if (!open) setDeletePlanTarget(null);
                }}
                itemName={deletePlanTarget?.name ?? ""}
                isPending={deletePlanMutation.isPending}
                onConfirm={() => {
                    if (deletePlanTarget)
                        deletePlanMutation.mutate(deletePlanTarget.id);
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

function Stat({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex flex-col gap-0.5">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
                {label}
            </span>
            <span className="font-medium text-foreground">{value}</span>
        </div>
    );
}
