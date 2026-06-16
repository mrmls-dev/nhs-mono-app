"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Building2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import { Skeleton } from "@workspace/ui/components/skeleton";
import {
    Empty,
    EmptyContent,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
    EmptyDescription,
} from "@workspace/ui/components/empty";
import {
    getCommunities,
    deleteCommunity,
    type CommunityListItem,
} from "@/api/community";
import { DeleteDialog } from "@/components/DeleteDialog";
import { ErrorDialog } from "@/components/ErrorDialog";

const STATUS_LABEL: Record<CommunityListItem["status"], string> = {
    NOW_SELLING: "Now Selling",
    COMING_SOON: "Coming Soon",
    SOLD_OUT: "Sold Out",
};

const STATUS_VARIANT: Record<
    CommunityListItem["status"],
    "default" | "secondary" | "outline"
> = {
    NOW_SELLING: "default",
    COMING_SOON: "secondary",
    SOLD_OUT: "outline",
};

const fmt = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
});

export function CommunitiesClient() {
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const qc = useQueryClient();

    const { data: communities, isPending, isError } = useQuery<CommunityListItem[]>({
        queryKey: ["communities"],
        queryFn: getCommunities,
    });

    const deleteMutation = useMutation({
        mutationFn: deleteCommunity,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["communities"] });
            toast.success("Community deleted.");
            setDeleteTarget(null);
        },
        onError: (err: Error) => {
            setDeleteTarget(null);
            setErrorMessage(err.message);
        },
    });

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-2xl font-semibold tracking-tight">
                    Communities
                </h1>
                <Button asChild>
                    <Link href="/dashboard/communities/new">
                        <Plus data-icon="inline-start" />
                        Add Community
                    </Link>
                </Button>
            </div>

            {isPending ? (
                <div className="flex flex-col gap-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-14 w-full rounded-lg" />
                    ))}
                </div>
            ) : isError ? (
                <p className="text-sm text-destructive">
                    Could not load communities. Make sure the API is running.
                </p>
            ) : communities && communities.length > 0 ? (
                <div className="overflow-hidden rounded-lg border">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-muted/50 text-left text-muted-foreground">
                                <th className="px-4 py-3 font-medium">Name</th>
                                <th className="px-4 py-3 font-medium hidden md:table-cell">
                                    County
                                </th>
                                <th className="px-4 py-3 font-medium">Status</th>
                                <th className="px-4 py-3 font-medium hidden sm:table-cell text-right">
                                    Price from
                                </th>
                                <th className="px-4 py-3 font-medium hidden lg:table-cell text-right">
                                    Homes
                                </th>
                                <th className="px-4 py-3" />
                            </tr>
                        </thead>
                        <tbody>
                            {communities.map((c, i) => (
                                <tr
                                    key={c.id}
                                    className={
                                        i < communities.length - 1
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
                                        <div className="text-xs text-muted-foreground font-mono">
                                            {c.slug}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                                        {c.county.name}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            {!c.published && (
                                                <Badge
                                                    variant="outline"
                                                    className="border-amber-500/50 text-amber-600 dark:text-amber-400"
                                                >
                                                    Draft
                                                </Badge>
                                            )}
                                            <Badge
                                                variant={STATUS_VARIANT[c.status]}
                                            >
                                                {STATUS_LABEL[c.status]}
                                            </Badge>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right text-muted-foreground hidden sm:table-cell">
                                        {fmt.format(c.priceFrom)}
                                    </td>
                                    <td className="px-4 py-3 text-right text-muted-foreground hidden lg:table-cell">
                                        {c.homesForSale}
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
                            <Building2 />
                        </EmptyMedia>
                        <EmptyTitle>No communities yet</EmptyTitle>
                        <EmptyDescription>
                            Add your first community to get started.
                        </EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent>
                        <Button asChild>
                            <Link href="/dashboard/communities/new">
                                <Plus data-icon="inline-start" />
                                Add your first community
                            </Link>
                        </Button>
                    </EmptyContent>
                </Empty>
            )}

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
