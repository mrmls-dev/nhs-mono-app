import Link from "next/link";
import { Plus, Building2 } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "@workspace/ui/components/empty";

export default function CommunitiesPage() {
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

            <Empty className="border border-dashed">
                <EmptyHeader>
                    <EmptyMedia variant="icon">
                        <Building2 />
                    </EmptyMedia>
                    <EmptyTitle>No communities yet</EmptyTitle>
                    <EmptyDescription>
                        Listings will appear here once persistence is wired up.
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
        </div>
    );
}
