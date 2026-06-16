"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { getCommunity } from "@/api/community";
import { getCounties } from "@/api/county";
import { CommunityForm } from "@/app/dashboard/communities/new/CommunityForm";
import type { CommunityFormValues } from "@/app/dashboard/communities/new/community-schema";

export function EditCommunityClient({ slug }: { slug: string }) {
    const communityQuery = useQuery({
        queryKey: ["community", slug],
        queryFn: () => getCommunity(slug),
    });
    const countiesQuery = useQuery({
        queryKey: ["counties"],
        queryFn: getCounties,
    });

    const community = communityQuery.data;
    const counties = countiesQuery.data;

    if (communityQuery.isPending || countiesQuery.isPending) {
        return (
            <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-96 w-full rounded-lg" />
            </div>
        );
    }

    if (communityQuery.isError || !community || !counties) {
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

    const initialValues: Partial<CommunityFormValues> = {
        slug: community.slug,
        name: community.name,
        brand: community.brand ?? "",
        location: community.location,
        image: community.image,
        status: community.status,
        homesForSale: String(community.homesForSale),
        lat: String(community.lat),
        lng: String(community.lng),
        about: community.about,
        countyId: community.county.id,
        amenities: community.amenities.map((a) => a.amenity.name),
        schools: community.schools.map((s) => ({
            name: s.name,
            type: s.type,
            grades: s.grades,
            distance: s.distance,
        })),
    };

    const countyOptions = counties.map((c) => ({
        id: c.id,
        name: c.name,
        region: c.region.name,
    }));

    return (
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
            <Button variant="ghost" size="sm" asChild className="w-fit">
                <Link href={`/dashboard/communities/${slug}`}>
                    <ArrowLeft data-icon="inline-start" />
                    Back to community
                </Link>
            </Button>
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-semibold tracking-tight">
                    Edit Community
                </h1>
                <p className="text-sm text-muted-foreground">
                    Update {community.name}&apos;s details, amenities, and
                    schools.
                </p>
            </div>

            <CommunityForm
                counties={countyOptions}
                communityId={community.id}
                initialValues={initialValues}
                submitLabel="Save changes"
            />
        </div>
    );
}
