import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { NewAgentForm } from "./_components/NewAgentForm";

export const metadata: Metadata = {
    title: "New Agent | Dashboard",
};

export default function NewAgentPage() {
    return (
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
            <div className="flex flex-col gap-1">
                <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="-ml-2 w-fit text-muted-foreground"
                >
                    <Link href="/dashboard/agents">
                        <ChevronLeft />
                        Agents
                    </Link>
                </Button>
                <h1 className="text-2xl font-semibold tracking-tight">
                    New agent
                </h1>
                <p className="text-sm text-muted-foreground">
                    Creates the platform account, branded site, and stores all
                    the information needed to provision a GHL sub-account.
                </p>
            </div>

            <NewAgentForm />
        </div>
    );
}
