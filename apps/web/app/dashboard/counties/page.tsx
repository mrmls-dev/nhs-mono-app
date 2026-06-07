import { MapPinned } from "lucide-react";
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "@workspace/ui/components/empty";

export default function CountiesPage() {
    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-2xl font-semibold tracking-tight">Counties</h1>
            <Empty className="border border-dashed">
                <EmptyHeader>
                    <EmptyMedia variant="icon">
                        <MapPinned />
                    </EmptyMedia>
                    <EmptyTitle>County management coming soon</EmptyTitle>
                    <EmptyDescription>
                        Counties are currently seeded from data/regions.json.
                    </EmptyDescription>
                </EmptyHeader>
            </Empty>
        </div>
    );
}
