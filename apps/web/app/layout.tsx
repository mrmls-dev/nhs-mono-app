import type { Metadata } from "next";
import "@workspace/ui/globals.css";
import { Toaster } from "@workspace/ui/components/sonner";
import { Providers } from "@/components/providers";
import { fontVariables } from "@/lib/fonts";

export const metadata: Metadata = {
    title: "National House Search | New Construction Agent Partnership Program",
    description:
        "Explore new construction communities across Southeast Florida. Browse floor plans, pricing, and amenities in Palm Beach, Broward, Miami-Dade, and Martin counties.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html
            lang="en"
            // All theme fonts declare their CSS variables here (preload:false, so
            // glyphs are only fetched when a tenant selects the font). `--font-sans`
            // / `--font-heading` default to Roboto; tenant themes override them on
            // their `[data-brand]` wrapper.
            className={`${fontVariables} font-sans h-full antialiased`}
            style={
                {
                    "--font-sans": "var(--font-roboto)",
                    "--font-heading": "var(--font-roboto)",
                } as React.CSSProperties
            }
            suppressHydrationWarning
        >
            <body className="min-h-full flex flex-col">
                <Providers>{children}</Providers>
                <Toaster />
            </body>
        </html>
    );
}
