import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { Home } from "lucide-react";
import regionsData from "@/data/regions.json";
import NavDropdown from "@/components/NavDropdown";

export default function MarketingLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <>
            <nav className="sticky top-0 z-50 h-21.25 bg-muted px-5 shadow-sm">
                <div className="container flex items-center justify-between h-full mx-auto">
                    <Link href="/" className="flex items-center gap-3">
                        <Image
                            src="/images/logo.png"
                            alt="National House Search"
                            width={110}
                            height={50}
                            priority
                            className="md:w-36.25 md:h-16.25"
                        />
                        <p className="hidden sm:flex flex-col border-l pl-3 ml-3">
                            <span className="text-foreground font-semibold text-sm md:text-base">
                                New Construction
                            </span>
                        </p>
                    </Link>

                    <div className="flex items-center gap-3">
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
                            <NavDropdown
                                counties={regionsData.regions.flatMap((r) =>
                                    r.counties.map((c) => ({
                                        id: c.id,
                                        name: c.name,
                                    })),
                                )}
                            />
                        </Suspense>
                    </div>
                </div>
            </nav>

            {children}

            <footer className="bg-secondary text-secondary-foreground">
                <div className="container mx-auto px-5 py-10 flex flex-col items-center gap-6 text-center">
                    <div className="flex flex-col items-center gap-1">
                        <Image
                            src="/images/logo.png"
                            alt="National House Search"
                            width={145}
                            height={65}
                            className="brightness-0 invert"
                        />
                        <p className="text-sm font-semibold tracking-wide text-secondary-foreground/80">
                            New Construction Agent Partnership Program
                        </p>
                    </div>

                    <div className="flex items-center gap-1.5 text-secondary-foreground/40">
                        <Home className="size-5" aria-label="Equal Housing Opportunity" />
                        <span className="text-xs">Equal Housing Opportunity</span>
                    </div>

                    <div className="w-16 border-t border-secondary-foreground/20" />

                    <p className="text-sm text-secondary-foreground/70">
                        © 2026 Simon Karim &nbsp;·&nbsp;{" "}
                        <a
                            href="tel:5617040091"
                            className="hover:text-primary transition-colors"
                        >
                            561-704-0091
                        </a>
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
        </>
    );
}
