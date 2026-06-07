import { Map } from "lucide-react";
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "@workspace/ui/components/empty";

export default function RegionsPage() {
    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-2xl font-semibold tracking-tight">Regions</h1>
            <Empty className="border border-dashed">
                <EmptyHeader>
                    <EmptyMedia variant="icon">
                        <Map />
                    </EmptyMedia>
                    <EmptyTitle>Region management coming soon</EmptyTitle>
                    <EmptyDescription>
                        Regions are currently seeded from data/regions.json.
                    </EmptyDescription>
                </EmptyHeader>
            </Empty>
        </div>
    );
}
