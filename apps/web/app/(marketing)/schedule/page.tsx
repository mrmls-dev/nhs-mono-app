import Script from "next/script";
import type { Metadata } from "next";
import ScheduleIframe from "@/components/ScheduleIframe";

export const metadata: Metadata = {
    title: "Schedule a Visit — National House Search",
    description:
        "Book a visit to one of our new construction communities in Southeast Florida.",
};

type Props = {
    searchParams: Promise<{ comm?: string; "fp-model"?: string }>;
};

export default async function SchedulePage({ searchParams }: Props) {
    const { comm, "fp-model": fpModel } = await searchParams;

    return (
        <main className="container mx-auto px-4 md:px-5 py-8 flex flex-col gap-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold text-foreground">Schedule a Visit</h1>
                {comm && (
                    <p className="text-sm text-muted-foreground">
                        {comm}
                        {fpModel && (
                            <span className="text-muted-foreground/60"> — {fpModel}</span>
                        )}
                    </p>
                )}
            </div>

            <ScheduleIframe comm={comm} fpModel={fpModel} />

            <Script
                src="https://api.mostro360.com/js/form_embed.js"
                strategy="afterInteractive"
            />
        </main>
    );
}
