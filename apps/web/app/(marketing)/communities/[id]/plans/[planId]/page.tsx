import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { ArrowLeft, Phone } from "lucide-react";
import { Badge } from "@workspace/ui/components/badge";
import { getCommunity, getPublicCommunities } from "@/api/community";
import { getAgentByDomain } from "@/api/agent";
import { formatPrice, formatStat } from "@/lib/format";
import CommunityGallery from "@/components/CommunityGallery";
import ExpandableText from "@/components/ExpandableText";
import ScheduleVisitButton from "@/components/ScheduleVisitButton";

type Props = { params: Promise<{ id: string; planId: string }> };

export async function generateMetadata({ params }: Props) {
    const { id, planId } = await params;
    const community = await getCommunity(id);
    const plan = community?.floorPlans.find((p) => p.slug === planId);
    if (!community || !plan) return { title: "Floor plan not found" };
    return {
        title: `${plan.name} · ${community.name}`,
        description: `Explore the ${plan.name} floor plan at ${community.name}. Starting from ${formatPrice(plan.startingPrice)}.`,
    };
}

export default async function FloorPlanPage({ params }: Props) {
    const { id, planId } = await params;
    const community = await getCommunity(id);
    const plan = community?.floorPlans.find((p) => p.slug === planId);

    if (!community || !plan) notFound();

    // Scope to the agent for this Host — a hidden/off-catalog community's plans
    // must not be reachable on its domain.
    const host = (await headers()).get("host") ?? undefined;
    const agent = await getAgentByDomain(host);
    const visible = await getPublicCommunities(agent.id);
    if (!visible.some((c) => c.slug === community.slug)) notFound();

    const galleryItems = plan.gallery.map((m) => ({
        type: "image" as const,
        src: m.src,
        alt: m.alt,
        caption: m.caption ?? undefined,
    }));

    const stats = [
        { label: "Bedrooms", value: formatStat(plan.beds, "Bed") },
        { label: "Bathrooms", value: formatStat(Number(plan.baths), "Bath") },
        { label: "Garage", value: `${plan.garage} Car` },
        { label: "Stories", value: formatStat(plan.stories, "Stor") },
        { label: "Sq. Ft.", value: Number(plan.sqft).toLocaleString() },
    ];

    return (
        <main className="container mx-auto px-4 md:px-5 py-6 md:py-8 flex flex-col gap-8 md:gap-12">
            <div className="flex flex-col gap-3">
                <nav className="text-sm text-muted-foreground">
                    <Link href="/" className="hover:text-primary">
                        Communities
                    </Link>
                    <span className="mx-2">/</span>
                    <Link
                        href={`/communities/${community.slug}`}
                        className="hover:text-primary"
                    >
                        {community.name}
                    </Link>
                    <span className="mx-2">/</span>
                    <span className="text-foreground">{plan.name}</span>
                </nav>
                <Link
                    href={`/communities/${community.slug}`}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                >
                    <ArrowLeft className="size-4" aria-hidden />
                    Back to {community.name}
                </Link>
            </div>

            {galleryItems.length > 0 && (
                <CommunityGallery
                    items={galleryItems}
                    fallbackImage={plan.image}
                    communityName={`${community.name} — ${plan.name}`}
                />
            )}

            <section className="flex flex-col gap-4 md:flex-row md:justify-between items-start">
                <div className="flex flex-col gap-4">
                    <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                        {community.brand
                            ? `${community.brand} · ${community.name}`
                            : community.name}
                    </p>
                    <div className="flex flex-wrap items-end gap-4">
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">
                            {plan.name}
                        </h1>
                        <Badge className="px-3 py-1 md:px-4 md:py-1.5 bg-primary text-primary-foreground text-base md:text-lg font-bold rounded-full hover:bg-primary">
                            {formatPrice(plan.startingPrice)}
                        </Badge>
                    </div>

                    <dl className="flex flex-wrap gap-6 pt-2">
                        {stats.map((s) => (
                            <div key={s.label} className="flex flex-col gap-0.5">
                                <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                                    {s.label}
                                </dt>
                                <dd className="text-lg font-semibold text-foreground">
                                    {s.value}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </div>

                <div className="flex flex-wrap gap-3 pt-2 md:justify-end">
                    <ScheduleVisitButton size="lg" comm={community.name} fpModel={plan.name} />
                    <a
                        href="tel:5617040091"
                        className="inline-flex items-center gap-2 px-6 py-3 text-base font-semibold rounded-lg border border-border text-foreground hover:bg-muted transition-colors"
                    >
                        <Phone className="size-4 shrink-0" aria-hidden />
                        561-704-0091
                    </a>
                </div>
            </section>

            {plan.description && (
                <section className="max-w-2xl flex flex-col gap-3">
                    <h2 className="text-2xl font-bold text-foreground">About this floor plan</h2>
                    <ExpandableText text={plan.description} />
                </section>
            )}

            <section className="flex flex-col gap-4">
                <h2 className="text-2xl font-bold text-foreground">Floor plan diagram</h2>
                {plan.diagramImage ? (
                    <div className="bg-muted rounded-xl border border-border overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={plan.diagramImage}
                            alt={`${plan.name} floor plan diagram`}
                            className="w-full object-contain max-h-[50vh] md:max-h-[70vh]"
                        />
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <span className="size-2 rounded-full bg-primary animate-pulse" />
                        <span className="text-sm font-medium text-muted-foreground">
                            Coming Soon
                        </span>
                    </div>
                )}
            </section>

            <section className="rounded-xl bg-secondary text-secondary-foreground px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex flex-col gap-1 text-center md:text-left">
                    <h2 className="text-xl font-bold">Love the {plan.name}?</h2>
                    <p className="text-secondary-foreground/70 text-sm">
                        Schedule a visit and see it in person — our team is ready to help.
                    </p>
                </div>
                <ScheduleVisitButton
                    size="lg"
                    className="shrink-0"
                    comm={community.name}
                    fpModel={plan.name}
                />
            </section>

            <div>
                <Link
                    href={`/communities/${community.slug}`}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                >
                    <ArrowLeft className="size-4" aria-hidden />
                    Back to {community.name}
                </Link>
            </div>
        </main>
    );
}
