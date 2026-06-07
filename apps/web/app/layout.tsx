import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "@workspace/ui/globals.css";
import { Toaster } from "@workspace/ui/components/sonner";

const roboto = Roboto({
    subsets: ["latin"],
    weight: ["300", "400", "500", "700", "900"],
});

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
            className={`${roboto.className} h-full antialiased font-sans`}
        >
            <body className="min-h-full flex flex-col">
                {children}
                <Toaster />
            </body>
        </html>
    );
}
