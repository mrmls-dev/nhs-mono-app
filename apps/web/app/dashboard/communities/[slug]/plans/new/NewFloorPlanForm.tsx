"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FloorPlanForm } from "@/app/dashboard/communities/_components/FloorPlanForm";
import type { FloorPlanFormOutput } from "@/app/dashboard/communities/_components/floor-plan-schema";
import { createFloorPlan } from "@/api/floor-plan";

export function NewFloorPlanForm({ communitySlug }: { communitySlug: string }) {
    const router = useRouter();
    const qc = useQueryClient();

    const onSubmit = async (values: FloorPlanFormOutput) => {
        const created = await createFloorPlan(communitySlug, values);
        qc.invalidateQueries({ queryKey: ["community", communitySlug] });
        toast.success(`"${created.name}" created.`);
        router.push(
            `/dashboard/communities/${communitySlug}/plans/${created.slug}`,
        );
    };

    return (
        <FloorPlanForm
            communitySlug={communitySlug}
            submitLabel="Create floor plan"
            onSubmit={onSubmit}
        />
    );
}
