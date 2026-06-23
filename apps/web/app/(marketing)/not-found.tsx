import Link from "next/link";
import { Home, MapPinOff } from "lucide-react";

/**
 * Rendered (inside the marketing nav/footer) whenever `notFound()` is called on
 * a marketing route — e.g. a community/plan slug that doesn't exist or isn't
 * visible for this agent. A friendly dead-end, not an error screen.
 */
export default function MarketingNotFound() {
    return (
        <main className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-5 py-16 text-center">
            <div className="flex size-20 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <MapPinOff className="size-9" />
            </div>
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
                    We couldn&rsquo;t find that page
                </h1>
                <p className="max-w-md text-sm text-muted-foreground">
                    The community or page you&rsquo;re looking for may have moved,
                    sold out, or isn&rsquo;t available in this area.
                </p>
            </div>
            <Link
                href="/"
                className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-6 font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
                <Home className="size-4" />
                Browse communities
            </Link>
        </main>
    );
}
