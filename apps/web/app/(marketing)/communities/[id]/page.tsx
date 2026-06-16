import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { ArrowLeft, ArrowRight, Phone } from "lucide-react";
import { Badge } from "@workspace/ui/components/badge";
import { Card, CardContent } from "@workspace/ui/components/card";
import { getCommunity, getPublicCommunity } from "@/api/community";
import { getAgentByDomain } from "@/api/agent";
import {
    formatRange,
    formatStories,
    formatGarage,
    formatPrice,
    formatStat,
    SPEC_PLACEHOLDER,
    STATUS_LABELS,
} from "@/lib/format";
import CommunityGallery from "@/components/CommunityGallery";
import ExpandableText from "@/components/ExpandableText";
import CommunityMap from "@/components/CommunityMap";
import ScheduleVisitButton from "@/components/ScheduleVisitButton";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
    const { id } = await params;
    const community = await getCommunity(id);
    if (!community) return { title: "Community not found" };
    return {
        title: community.name,
        description: `Explore homes, floor plans, and amenities at ${community.name} in ${community.location}.`,
    };
}

export default async function CommunityPage({ params }: Props) {
    const { id } = await params;

    // Scope to the agent for this Host: a community that's a draft, outside the
    // agent's assigned counties, or hidden must not be reachable on its domain.
    const host = (await headers()).get("host") ?? undefined;
    const agent = await getAgentByDomain(host);
    const community = await getPublicCommunity(id, agent.id);
    if (!community) notFound();

    const isSelling = community.status === "NOW_SELLING";
    const status = STATUS_LABELS[community.status] ?? community.status;

    // Merge all floor plan galleries for the hero gallery component
    const galleryItems = community.floorPlans.flatMap((fp) =>
        fp.gallery.map((m) => ({
            type: "image" as const,
            src: m.src,
            alt: m.alt,
            caption: m.caption ?? undefined,
        })),
    );

    const amenityNames = community.amenities.map((a) => a.amenity.name);

    return (
        <main className="container mx-auto px-4 md:px-5 py-6 md:py-8 flex flex-col gap-8 md:gap-12">
            <div className="flex flex-col gap-3">
                <nav className="text-sm text-muted-foreground">
                    <Link href="/" className="hover:text-primary">
                        Communities
                    </Link>
                    <span className="mx-2">/</span>
                    <span className="text-foreground">{community.name}</span>
                </nav>
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                >
                    <ArrowLeft className="size-4" aria-hidden />
                    Back to Communities
                </Link>
            </div>

            <CommunityGallery
                items={galleryItems}
                fallbackImage={community.image}
                communityName={community.name}
            />

            <section className="flex flex-col gap-4 md:flex-row md:justify-between items-start">
                <div className="flex flex-col gap-3">
                    {community.brand && (
                        <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                            {community.brand}
                        </p>
                    )}
                    <div className="flex items-center gap-3 flex-wrap">
                        <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
                            {community.name}
                        </h1>
                        <Badge
                            className={`rounded-full ${
                                isSelling
                                    ? "bg-primary text-primary-foreground hover:bg-primary"
                                    : "bg-secondary text-secondary-foreground hover:bg-secondary"
                            }`}
                        >
                            {status}
                        </Badge>
                    </div>
                    <p className="text-muted-foreground">{community.location}</p>
                    <p className="text-sm font-semibold text-primary">
                        {community.floorPlans.length} Floor{" "}
                        {community.floorPlans.length === 1 ? "Plan" : "Plans"} Available
                    </p>
                    <p className="text-foreground">
                        {community.floorPlans.length > 0
                            ? formatRange(community.bedsMin, community.bedsMax, "Bed")
                            : SPEC_PLACEHOLDER}
                        <span className="mx-2 text-secondary/50">|</span>
                        {community.floorPlans.length > 0
                            ? formatRange(Number(community.bathsMin), Number(community.bathsMax), "Bath")
                            : SPEC_PLACEHOLDER}
                        <span className="mx-2 text-secondary/50">|</span>
                        {community.floorPlans.length > 0
                            ? formatGarage(community.garageMin, community.garageMax)
                            : SPEC_PLACEHOLDER}
                    </p>
                    <p className="text-foreground">
                        {community.floorPlans.length > 0
                            ? formatStories(community.storiesMin, community.storiesMax)
                            : SPEC_PLACEHOLDER}
                        <span className="mx-2 text-secondary/50">|</span>
                        {community.floorPlans.length > 0
                            ? `From ${Number(community.sqftFrom).toLocaleString()} Sq. Ft.`
                            : SPEC_PLACEHOLDER}
                    </p>
                    <div className="pt-3 border-t border-border">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                            Pricing starting from
                        </p>
                        <p className="text-2xl md:text-3xl font-bold text-foreground">
                            {community.floorPlans.length > 0
                                ? `From ${formatPrice(community.priceFrom)}`
                                : SPEC_PLACEHOLDER}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-2 md:justify-end">
                    <ScheduleVisitButton size="lg" comm={community.name} />
                    <a
                        href="tel:5617040091"
                        className="inline-flex items-center gap-2 px-6 py-3 text-base font-semibold rounded-lg border border-border text-foreground hover:bg-muted transition-colors"
                    >
                        <Phone className="size-4 shrink-0" aria-hidden />
                        561-704-0091
                    </a>
                </div>
            </section>

            <section className="grid md:grid-cols-2 gap-14">
                <div className="flex flex-col gap-3">
                    <h2 className="text-2xl font-bold text-foreground">About our community</h2>
                    <ExpandableText text={community.about} />
                </div>

                <div className="flex flex-col gap-3">
                    <h2 className="text-2xl font-bold text-foreground">Community amenities</h2>
                    {amenityNames.length > 0 ? (
                        <ul className="grid grid-cols-2 gap-2">
                            {amenityNames.map((a) => (
                                <li key={a} className="flex items-center gap-2 text-foreground">
                                    <span aria-hidden className="size-1.5 rounded-full bg-primary" />
                                    {a}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-muted-foreground">
                            Amenities details not available yet. Please contact us for more information.
                        </p>
                    )}
                </div>
            </section>

            <section className="flex flex-col gap-4">
                <h2 className="text-2xl font-bold text-foreground">Schools</h2>
                {community.schools.length > 0 ? (
                    <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {community.schools.map((s) => (
                            <li key={s.name}>
                                <Card>
                                    <CardContent className="p-4">
                                        <p className="font-semibold">{s.name}</p>
                                        <p className="text-sm text-muted-foreground flex gap-x-2">
                                            <span>{s.type}</span> |
                                            <span>{s.grades}</span> |
                                            <span>{s.distance}</span>
                                        </p>
                                    </CardContent>
                                </Card>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-muted-foreground">
                        School information not available. Please contact us for details.
                    </p>
                )}
            </section>

            <section className="flex flex-col gap-6">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">
                        Models &amp; Floor Plans
                    </h2>
                    <p className="text-muted-foreground mt-1">
                        Click any model to explore photos, diagram, and details.
                    </p>
                </div>
                {community.floorPlans.length > 0 ? (
                    <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-8">
                        {community.floorPlans.map((p) => (
                            <li key={p.id}>
                                <Link
                                    href={`/communities/${community.slug}/plans/${p.slug}`}
                                    className="group block"
                                >
                                    <Card className="overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
                                        <div className="aspect-video bg-muted overflow-hidden">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={p.image}
                                                alt={p.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        </div>
                                        <CardContent className="p-3 md:p-5 flex flex-col gap-2">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="text-lg md:text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
                                                    {p.name}
                                                </p>
                                                <Badge className="shrink-0 rounded-full bg-primary text-primary-foreground hover:bg-primary">
                                                    {formatPrice(p.startingPrice)}
                                                </Badge>
                                            </div>
                                            <div className="flex flex-wrap gap-x-2 gap-y-1 text-sm text-foreground">
                                                <span>{formatStat(p.beds, "Bed")}</span>
                                                <span className="text-secondary/50">|</span>
                                                <span>{formatStat(Number(p.baths), "Bath")}</span>
                                                <span className="text-secondary/50">|</span>
                                                <span>{p.garage} Car Garage</span>
                                                <span className="text-secondary/50">|</span>
                                                <span>{Number(p.sqft).toLocaleString()} Sq. Ft.</span>
                                            </div>
                                            <div className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                                                View model
                                                <ArrowRight
                                                    className="size-4 group-hover:translate-x-1 transition-transform"
                                                    aria-hidden
                                                />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-muted-foreground">Floor plans coming soon.</p>
                )}
            </section>

            <section className="rounded-xl bg-secondary text-secondary-foreground px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex flex-col gap-1 text-center md:text-left">
                    <h2 className="text-xl font-bold">Ready to visit {community.name}?</h2>
                    <p className="text-secondary-foreground/70 text-sm">
                        Schedule a tour and let our team guide you home.
                    </p>
                </div>
                <ScheduleVisitButton size="lg" className="shrink-0" comm={community.name} />
            </section>

            {community.lat !== 0 && community.lng !== 0 && (
                <section className="flex flex-col gap-4">
                    <h2 className="text-2xl font-bold text-foreground">Community location</h2>
                    <CommunityMap
                        name={community.name}
                        coords={{ lat: community.lat, lng: community.lng }}
                        schools={community.schools}
                    />
                </section>
            )}
        </main>
    );
}
