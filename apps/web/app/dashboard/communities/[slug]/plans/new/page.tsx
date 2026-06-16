import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { NewFloorPlanForm } from "./NewFloorPlanForm";

export const metadata: Metadata = {
    title: "Add Floor Plan | Dashboard",
};

export default async function NewFloorPlanPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;

    return (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
            <Button variant="ghost" size="sm" asChild className="w-fit">
                <Link href={`/dashboard/communities/${slug}`}>
                    <ArrowLeft data-icon="inline-start" />
                    Back to community
                </Link>
            </Button>
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-semibold tracking-tight">
                    Add Floor Plan
                </h1>
                <p className="text-sm text-muted-foreground">
                    Create a floor plan with its gallery and details.
                </p>
            </div>
            <NewFloorPlanForm communitySlug={slug} />
        </div>
    );
}
