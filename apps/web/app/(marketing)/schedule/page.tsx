import Script from "next/script";
import type { Metadata } from "next";
import { headers } from "next/headers";
import ScheduleIframe from "@/components/ScheduleIframe";
import { getAgentByDomain } from "@/api/agent";

export const metadata: Metadata = {
    title: "Schedule a Visit",
    description:
        "Book a visit to one of our new construction communities in Southeast Florida.",
};

type Props = {
    searchParams: Promise<{ comm?: string; "fp-model"?: string }>;
};

export default async function SchedulePage({ searchParams }: Props) {
    const { comm, "fp-model": fpModel } = await searchParams;

    // Use the agent's own GoHighLevel booking embed when they've set one;
    // otherwise fall back to the platform's context-aware scheduler.
    const host = (await headers()).get("host") ?? undefined;
    const agent = await getAgentByDomain(host);
    const customEmbed = agent.ghlScheduleEmbed?.trim();

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

            {customEmbed ? (
                <iframe
                    title="Schedule a visit"
                    className="h-160 w-full rounded-lg border bg-background"
                    sandbox="allow-scripts allow-forms allow-popups allow-same-origin"
                    srcDoc={`<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{margin:0;font-family:system-ui,sans-serif}</style></head><body>${customEmbed}<script src="https://api.mostro360.com/js/form_embed.js"></script></body></html>`}
                />
            ) : (
                <>
                    <ScheduleIframe comm={comm} fpModel={fpModel} />
                    <Script
                        src="https://api.mostro360.com/js/form_embed.js"
                        strategy="afterInteractive"
                    />
                </>
            )}
        </main>
    );
}
