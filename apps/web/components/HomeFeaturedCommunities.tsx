import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BedDouble, LayoutGrid } from "lucide-react";
import { Badge } from "@workspace/ui/components/badge";
import Reveal from "@/components/Reveal";

export type FeaturedCommunity = {
    slug: string;
    name: string;
    location: string;
    image: string;
    county: string;
    beds: string;
    plans: number;
    priceFrom: string;
};

export default function HomeFeaturedCommunities({
    communities,
}: {
    communities: FeaturedCommunity[];
}) {
    return (
        <section className="relative overflow-hidden border-b border-border bg-muted/30">
            {/* Community aerial backdrop under a theme wash; the cards sit on top */}
            <Image
                src="/images/community_drone_shot.webp"
                alt=""
                fill
                sizes="100vw"
                className="absolute inset-0 object-cover object-center"
            />
            <div aria-hidden className="absolute inset-0 bg-background/85" />
            <div className="relative container mx-auto flex flex-col gap-10 px-5 py-16 lg:py-24">
                <Reveal className="flex flex-col gap-3">
                    <span className="text-xs font-semibold tracking-[0.15em] text-primary uppercase">
                        Featured communities
                    </span>
                    <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground text-balance sm:text-4xl">
                        New neighborhoods selling right now
                    </h2>
                    <p className="max-w-2xl text-base text-muted-foreground">
                        A sample of active new-construction communities. Find your
                        match to see every home that fits your budget and
                        must-haves.
                    </p>
                </Reveal>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {communities.map((c, i) => (
                        <Reveal key={c.slug} delay={(i % 3) * 0.08}>
                            <Link
                                href={`/communities/${c.slug}`}
                                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
                            >
                                <div className="relative h-44 overflow-hidden bg-muted">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={c.image}
                                        alt={c.name}
                                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    />
                                    <Badge className="absolute top-3 left-3 rounded-full bg-primary text-primary-foreground hover:bg-primary">
                                        Now Selling
                                    </Badge>
                                    {c.county && (
                                        <span className="absolute right-3 bottom-3 rounded-full bg-background/85 px-2.5 py-1 text-xs font-medium text-foreground backdrop-blur">
                                            {c.county}
                                        </span>
                                    )}
                                </div>

                                <div className="flex flex-1 flex-col gap-3 p-5">
                                    <div className="flex flex-col gap-0.5">
                                        <h3 className="text-lg font-bold text-foreground transition-colors group-hover:text-primary">
                                            {c.name}
                                        </h3>
                                        <p className="line-clamp-1 text-sm text-muted-foreground">
                                            {c.location}
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-foreground">
                                        <span className="inline-flex items-center gap-1.5">
                                            <BedDouble
                                                className="size-4 text-muted-foreground"
                                                aria-hidden
                                            />
                                            {c.beds}
                                        </span>
                                        <span className="inline-flex items-center gap-1.5">
                                            <LayoutGrid
                                                className="size-4 text-muted-foreground"
                                                aria-hidden
                                            />
                                            {c.plans} floor plans
                                        </span>
                                    </div>

                                    <div className="mt-auto flex items-end justify-between gap-3 border-t border-border pt-3">
                                        <div>
                                            <p className="text-xs tracking-wide text-muted-foreground uppercase">
                                                From
                                            </p>
                                            <p className="text-xl font-bold text-foreground">
                                                {c.priceFrom}
                                            </p>
                                        </div>
                                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                                            Explore
                                            <ArrowRight
                                                className="size-4 transition-transform group-hover:translate-x-0.5"
                                                aria-hidden
                                            />
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    );
}
