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
    mapboxToken,
    bedsMin,
    bathsMin,
    priceMax,
}: {
    agentId: string;
    countyId?: string;
    countyBounds?: CountyBounds;
    countyName?: string;
    /** Agent's domain-restricted Mapbox token (null on subdomain/apex sites). */
    mapboxToken?: string | null;
    /** Buyer-match filters: show communities offering at least this many beds/baths,
        within the given price ceiling. A community with more beds/baths still qualifies. */
    bedsMin?: number;
    bathsMin?: number;
    priceMax?: number;
}) {
    const all = await getPublicCommunities(agentId);

    const hasMatchFilters =
        bedsMin !== undefined ||
        bathsMin !== undefined ||
        priceMax !== undefined;

    const filtered = all.filter((c) => {
        if (countyId && c.countyId !== countyId) return false;
        // Spec filters only apply to communities that have floor plans (priced).
        if (bedsMin !== undefined && c.bedsMin < bedsMin) return false;
        if (bathsMin !== undefined && Number(c.bathsMin) < bathsMin) return false;
        if (priceMax !== undefined && Number(c.priceFrom) > priceMax) return false;
        return true;
    });
    const data = filtered.map(toCard);

    const pins: CommunityPin[] = filtered
        .filter((c) => c.lat !== 0 || c.lng !== 0)
        .map((c) => ({
            id: c.id,
            slug: c.slug,
            name: c.name,
            location: c.location,
            status: c.status,
            priceFrom: c._count.floorPlans > 0 ? formatPrice(c.priceFrom) : "",
            image: c.image,
            coords: { lat: c.lat, lng: c.lng },
        }));

    return (
        <>
            <section className="flex w-full flex-col items-start md:flex-row">
                {/* Map */}
                <div
                    id="map-section"
                    className="h-[58vh] w-full md:sticky md:top-21.25 md:h-[calc(100dvh-5.3125rem)] md:w-1/2"
                >
                    <ListingMap
                        communities={pins}
                        countyBounds={countyBounds}
                        mapboxToken={mapboxToken}
                    />
                </div>

                {/* Listings */}
                <div
                    id="listings-section"
                    className="flex w-full flex-col gap-4 p-4 pb-28 md:w-1/2 md:gap-6 md:p-6 md:pb-6"
                >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex flex-col gap-0.5">
                            <h2 className="text-xl font-bold text-foreground">
                                {countyName ?? "Southeast Florida Communities"}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                {data.length > 0
                                    ? `${data.length} ${data.length === 1 ? "community" : "communities"}${hasMatchFilters ? " matching your search" : " available"}`
                                    : hasMatchFilters
                                      ? "No matches — try widening your search"
                                      : countyName
                                        ? "No communities listed yet"
                                        : "Explore new construction across all counties"}
                            </p>
                        </div>
                        <ScheduleVisitButton size="sm" />
                    </div>

                    {data.length === 0 ? (
                        <div className="flex min-h-96 flex-col items-center justify-center gap-4 text-center">
                            <div className="flex size-16 items-center justify-center rounded-full bg-muted text-3xl">
                                🏗️
                            </div>
                            <div className="flex flex-col gap-1">
                                <p className="text-lg font-semibold text-foreground">
                                    {hasMatchFilters
                                        ? "No homes match your search"
                                        : `No communities yet in ${countyName ?? "this county"}`}
                                </p>
                                <p className="max-w-xs text-sm text-muted-foreground">
                                    {hasMatchFilters
                                        ? "Try adjusting your beds, baths, or budget to see more communities."
                                        : "We’re actively expanding into this area. Check back soon for new communities."}
                                </p>
                            </div>
                        </div>
                    ) : (
                        data.map((community) => (
                            <CommunityCard
                                key={community.id}
                                community={community}
                            />
                        ))
                    )}
                </div>
            </section>

            <MobileTabBar />
        </>
    );
}
