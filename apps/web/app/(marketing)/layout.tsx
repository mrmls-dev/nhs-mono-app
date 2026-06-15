import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { headers } from "next/headers";
import { Home } from "lucide-react";
import { getCounties } from "@/api/county";
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
        return { title: agent.siteName ?? agent.name };
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

    const counties = await getCounties();
    const logoSrc = agent.logo ?? "/images/logo.png";

    return (
        <BrandThemeProvider theme={resolveTheme(agent)}>
            <nav className="sticky top-0 z-50 h-21.25 bg-muted px-5 shadow-sm">
                <div className="container flex items-center justify-between h-full mx-auto">
                    <Link href="/" className="flex items-center gap-3">
                        <Image
                            src={logoSrc}
                            alt={siteName}
                            width={110}
                            height={50}
                            priority
                            className="md:w-36.25 md:h-16.25 object-contain"
                        />
                        <p className="hidden sm:flex flex-col border-l pl-3 ml-3">
                            <span className="text-foreground font-semibold text-sm md:text-base">
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
                            className="inline-flex items-center gap-1.5 px-3 h-8 sm:px-5 sm:h-10 rounded text-xs sm:text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-border transition-colors"
                        >
                            <Home className="size-3.5 sm:size-4 shrink-0" />
                            Home
                        </a>
                        <Suspense
                            fallback={
                                <button
                                    type="button"
                                    className="inline-flex items-center gap-2 px-5 h-10 bg-primary text-primary-foreground font-semibold rounded"
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
                <div className="container mx-auto px-5 py-10 flex flex-col items-center gap-6 text-center">
                    <div className="flex flex-col items-center gap-1">
                        <Image
                            src={logoSrc}
                            alt={siteName}
                            width={145}
                            height={65}
                            className="brightness-0 invert object-contain"
                        />
                        <p className="text-sm font-semibold tracking-wide text-secondary-foreground/80">
                            {agent.footerText ?? ""}
                        </p>
                    </div>

                    <div className="flex items-center gap-1.5 text-secondary-foreground/40">
                        <Home className="size-5" aria-label="Equal Housing Opportunity" />
                        <span className="text-xs">Equal Housing Opportunity</span>
                    </div>

                    <div className="w-16 border-t border-secondary-foreground/20" />

                    <p className="text-sm text-secondary-foreground/70">
                        © 2026 {siteName}
                        {agent.contactPhone && (
                            <>
                                &nbsp;·&nbsp;{" "}
                                <a
                                    href={`tel:${agent.contactPhone.replace(/\D/g, "")}`}
                                    className="hover:text-primary transition-colors"
                                >
                                    {agent.contactPhone}
                                </a>
                            </>
                        )}
                    </p>

                    <p className="max-w-2xl text-xs text-secondary-foreground/50 leading-relaxed">
                        All rates, financing programs, closing-cost incentives, buyer
                        credits, commissions, and bonuses are subject to change,
                        qualification, builder program rules, community availability, and
                        broker participation. Equal Housing Opportunity. This page is for
                        informational and marketing purposes only.
                    </p>
                </div>
            </footer>
        </BrandThemeProvider>
    );
}
