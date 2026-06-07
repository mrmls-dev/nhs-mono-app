import { LayoutTemplate } from "lucide-react";
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "@workspace/ui/components/empty";

export default function FloorPlansPage() {
    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-2xl font-semibold tracking-tight">
                Floor Plans
            </h1>
            <Empty className="border border-dashed">
                <EmptyHeader>
                    <EmptyMedia variant="icon">
                        <LayoutTemplate />
                    </EmptyMedia>
                    <EmptyTitle>Floor plan management coming soon</EmptyTitle>
                    <EmptyDescription>
                        Floor plans are managed inline when adding a community.
                    </EmptyDescription>
                </EmptyHeader>
            </Empty>
        </div>
    );
}
