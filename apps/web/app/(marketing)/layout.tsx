import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { headers } from "next/headers";
import { Home } from "lucide-react";
import { getPublicCounties } from "@/api/county";
import { getAgentByDomain } from "@/api/agent";
import NavDropdown from "@/components/NavDropdown";
import { BrandThemeProvider } from "@/components/BrandThemeProvider";
import { PublicThemeToggle } from "@/components/PublicThemeToggle";
import { SiteSuspended } from "@/components/SiteSuspended";
import { resolveTheme } from "@/lib/theme";
import type { Metadata } from "next";

/** Per-agent <title>/SEO, resolved from the request Host. */
export async function generateMetadata(): Promise<Metadata> {
    const host = (await headers()).get("host") ?? undefined;
    try {
        const agent = await getAgentByDomain(host);
        // Brand suffix applied to sub-page titles via the title template,
        // e.g. "Blossom Trail | National House Search". `||` so blank SEO
        // fields fall through to the site name rather than rendering empty.
        const suffix = agent.titleSuffix || agent.siteName || agent.name;
        const description = agent.metaDescription || undefined;
        const ogTitle = agent.seoTitle || suffix;
        return {
            title: {
                default: agent.seoTitle || agent.siteName || agent.name,
                template: `%s | ${suffix}`,
            },
            description,
            openGraph: { title: ogTitle, description },
            twitter: { title: ogTitle, description },
        };
    } catch {
        return {};
    }
}

export default async function MarketingLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    // Resolve the agent (white-label org) for this request by its Host header.
    const host = (await headers()).get("host") ?? undefined;
    const agent = await getAgentByDomain(host);

    const siteName = agent.siteName ?? agent.name;

    // Suspended agents serve a payment-required placeholder, not the site.
    if (agent.serviceStatus === "suspended") {
        return <SiteSuspended siteName={siteName} />;
    }

    const counties = await getPublicCounties(agent.id);
    const logoSrc = agent.logo ?? "/images/logo.png";

    return (
        <BrandThemeProvider theme={resolveTheme(agent)}>
            <nav className="sticky top-0 z-50 h-21.25 bg-muted px-5 shadow-sm">
                <div className="container mx-auto flex h-full items-center justify-between">
                    <Link href="/" className="flex items-center gap-3">
                        <Image
                            src={logoSrc}
                            alt={siteName}
                            width={110}
                            height={50}
                            priority
                            className="object-contain md:h-16.25 md:w-36.25"
                        />
                        <p className="ml-3 hidden flex-col border-l pl-3 sm:flex">
                            <span className="text-sm font-semibold text-foreground md:text-base">
                                {siteName}
                            </span>
                        </p>
                    </Link>

                    <div className="flex items-center gap-3">
                        <PublicThemeToggle />
                        <a
                            href="https://nationalhousesearch.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-8 items-center gap-1.5 rounded px-3 text-xs font-semibold text-muted-foreground transition-colors hover:bg-border hover:text-foreground sm:h-10 sm:px-5 sm:text-sm"
                        >
                            <Home className="size-3.5 shrink-0 sm:size-4" />
                            Home
                        </a>
                        <Suspense
                            fallback={
                                <button
                                    type="button"
                                    className="inline-flex h-10 items-center gap-2 rounded bg-primary px-5 font-semibold text-primary-foreground"
                                    disabled
                                >
                                    All Counties
                                </button>
                            }
                        >
                            <NavDropdown counties={counties} />
                        </Suspense>
                    </div>
                </div>
            </nav>

            {children}

            <footer className="bg-secondary text-secondary-foreground">
                <div className="container mx-auto flex flex-col items-center gap-6 px-5 py-10 text-center">
                    <div className="flex flex-col items-center gap-1">
                        <Image
                            src={logoSrc}
                            alt={siteName}
                            width={145}
                            height={65}
                            className="object-contain brightness-0 invert"
                        />
                        <p className="text-sm font-semibold tracking-wide text-secondary-foreground/80">
                            {agent.footerText ?? ""}
                        </p>
                    </div>

                    <div className="flex items-center gap-1.5 text-secondary-foreground/40">
                        <Home
                            className="size-5"
                            aria-label="Equal Housing Opportunity"
                        />
                        <span className="text-xs">
                            Equal Housing Opportunity
                        </span>
                    </div>

                    <div className="w-16 border-t border-secondary-foreground/20" />

                    <p className="text-sm text-secondary-foreground/70">
                        © 2026 {siteName}
                        {agent.contactPhone && (
                            <>
                                &nbsp;·&nbsp;{" "}
                                <a
                                    href={`tel:${agent.contactPhone.replace(/\D/g, "")}`}
                                    className="transition-colors hover:text-primary"
                                >
                                    {agent.contactPhone}
                                </a>
                            </>
                        )}
                    </p>

                    <p className="max-w-2xl text-xs leading-relaxed text-secondary-foreground/50">
                        All rates, financing programs, closing-cost incentives,
                        buyer credits, commissions, and bonuses are subject to
                        change, qualification, builder program rules, community
                        availability, and broker participation. Equal Housing
                        Opportunity. This page is for informational and
                        marketing purposes only.
                    </p>
                </div>
            </footer>
        </BrandThemeProvider>
    );
}
