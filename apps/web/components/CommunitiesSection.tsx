import { getPublicCommunities, type CommunityListItem } from "@/api/community";
import {
    formatRange,
    formatStories,
    formatGarage,
    formatPrice,
    SPEC_PLACEHOLDER,
    STATUS_LABELS,
} from "@/lib/format";
import CommunityCard, { type Community } from "./CommunityCard";
import ListingMap, { type CommunityPin, type CountyBounds } from "./ListingMap";
import MobileTabBar from "./MobileTabBar";
import ScheduleVisitButton from "./ScheduleVisitButton";

function toCard(c: CommunityListItem): Community {
    // Specs are derived from floor plans; with none they're all 0 → show "—".
    const hasPlans = c._count.floorPlans > 0;
    return {
        id: c.id,
        slug: c.slug,
        name: c.name,
        status: STATUS_LABELS[c.status] ?? c.status,
        location: c.location,
        image: c.image,
        homesForSale: c.homesForSale,
        beds: hasPlans
            ? formatRange(c.bedsMin, c.bedsMax, "Bed")
            : SPEC_PLACEHOLDER,
        baths: hasPlans
            ? formatRange(Number(c.bathsMin), Number(c.bathsMax), "Bath")
            : SPEC_PLACEHOLDER,
        garage: hasPlans
            ? formatGarage(c.garageMin, c.garageMax)
            : SPEC_PLACEHOLDER,
        stories: hasPlans
            ? formatStories(c.storiesMin, c.storiesMax)
            : SPEC_PLACEHOLDER,
        sqftFrom: hasPlans
            ? Number(c.sqftFrom).toLocaleString()
            : SPEC_PLACEHOLDER,
        priceFrom: hasPlans ? formatPrice(c.priceFrom) : SPEC_PLACEHOLDER,
        coords: { lat: c.lat, lng: c.lng },
        floorPlans: Array(c._count.floorPlans).fill({}),
    };
}

// ─────────────────────────────────────────────────────────────────────────────

export default async function CommunitiesSection({
    agentId,
    countyId,
    countyBounds,
    countyName,
}: {
    agentId: string;
    countyId?: string;
    countyBounds?: CountyBounds;
    countyName?: string;
}) {
    const all = await getPublicCommunities(agentId);

    const filtered = countyId ? all.filter((c) => c.countyId === countyId) : all;
    const data = filtered.map(toCard);

    const pins: CommunityPin[] = filtered
        .filter((c) => c.lat !== 0 || c.lng !== 0)
        .map((c) => ({
            id: c.id,
            name: c.name,
            location: c.location,
            status: c.status,
            priceFrom: c._count.floorPlans > 0 ? formatPrice(c.priceFrom) : "",
            image: c.image,
            coords: { lat: c.lat, lng: c.lng },
        }));

    return (
        <>
            <section className="w-full flex flex-col md:flex-row items-start">
                {/* Map */}
                <div
                    id="map-section"
                    className="w-full h-[58vh] md:w-1/2 md:sticky md:top-21.25 md:h-[calc(100dvh-5.3125rem)]"
                >
                    <ListingMap communities={pins} countyBounds={countyBounds} />
                </div>

                {/* Listings */}
                <div
                    id="listings-section"
                    className="w-full md:w-1/2 p-4 md:p-6 flex flex-col gap-4 md:gap-6 pb-28 md:pb-6"
                >
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex flex-col gap-0.5">
                            <h2 className="text-xl font-bold text-foreground">
                                {countyName ?? "Southeast Florida Communities"}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                {data.length > 0
                                    ? `${data.length} ${data.length === 1 ? "community" : "communities"} available`
                                    : countyName
                                    ? "No communities listed yet"
                                    : "Explore new construction across all counties"}
                            </p>
                        </div>
                        <ScheduleVisitButton size="sm" />
                    </div>

                    {data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center min-h-96 text-center gap-4">
                            <div className="size-16 rounded-full bg-muted flex items-center justify-center text-3xl">
                                🏗️
                            </div>
                            <div className="flex flex-col gap-1">
                                <p className="text-lg font-semibold text-foreground">
                                    No communities yet in{" "}
                                    {countyName ?? "this county"}
                                </p>
                                <p className="text-sm text-muted-foreground max-w-xs">
                                    We&rsquo;re actively expanding into this area.
                                    Check back soon for new communities.
                                </p>
                            </div>
                        </div>
                    ) : (
                        data.map((community) => (
                            <CommunityCard key={community.id} community={community} />
                        ))
                    )}
                </div>
            </section>

            <MobileTabBar />
        </>
    );
}
