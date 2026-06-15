import { Home, Clock } from "lucide-react";

/**
 * Shown in place of the public marketing site when the resolved tenant's
 * `serviceStatus` is "suspended" (payment lapsed). The agent dashboard stays
 * reachable on the canonical host — only the public site is taken down.
 *
 * Phase 1: rendered from the mock tenant. Phase 5 gates by the Host-resolved
 * tenant's real `serviceStatus`.
 */
export function SiteSuspended({ siteName }: { siteName: string }) {
    return (
        <main className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted px-6 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-background text-muted-foreground shadow-sm">
                <Clock className="size-7" />
            </div>
            <div className="flex max-w-md flex-col gap-3">
                <h1 className="text-2xl font-semibold tracking-tight">
                    This site is temporarily unavailable
                </h1>
                <p className="text-sm text-muted-foreground">
                    {siteName} is offline while the account is brought up to date.
                    Please check back soon, or contact us if you were looking for
                    a specific home.
                </p>
            </div>
            <a
                href="https://nationalhousesearch.com"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
                <Home className="size-4" />
                Visit National House Search
            </a>
        </main>
    );
}
