"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { ThemeProvider } from "./theme-provider";

export function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 30_000,
                        retry: 1,
                    },
                },
            }),
    );

    return (
        <QueryClientProvider client={queryClient}>
            {/* Light by default; the public marketing site exposes a dark toggle.
                System preference is opt-out so the dashboard stays predictable. */}
            <ThemeProvider defaultTheme="light" enableSystem={false}>
                {children}
            </ThemeProvider>
        </QueryClientProvider>
    );
}
