import regionsData from "@/data/regions.json";
import CommunityCard, { type Community } from "./CommunityCard";
import ListingMap, { type CommunityPin, type CountyBounds } from "./ListingMap";
import MobileTabBar from "./MobileTabBar";
import ScheduleVisitButton from "./ScheduleVisitButton";

export default function CommunitiesSection({ countyId }: { countyId?: string }) {
    const allCounties = regionsData.regions.flatMap((r) => r.counties);

    const counties = countyId
        ? allCounties.filter((c) => c.id === countyId)
        : allCounties;

    const data = counties.flatMap((c) => c.communities) as unknown as Community[];

    const pins: CommunityPin[] = data
        .filter((c) => c.coords && (c.coords.lat !== 0 || c.coords.lng !== 0))
        .map((c) => ({
            id: c.id,
            name: c.name,
            location: c.location,
            status: c.status,
            priceFrom: c.priceFrom,
            image: c.image,
            coords: c.coords!,
        }));

    const selectedCounty = countyId
        ? allCounties.find((c) => c.id === countyId)
        : null;
    const countyBounds = selectedCounty?.bounds as CountyBounds | undefined;

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
                                {selectedCounty
                                    ? selectedCounty.name
                                    : "Southeast Florida Communities"}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                {data.length > 0
                                    ? `${data.length} ${data.length === 1 ? "community" : "communities"} available`
                                    : selectedCounty
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
                                    {selectedCounty?.name ?? "this county"}
                                </p>
                                <p className="text-sm text-muted-foreground max-w-xs">
                                    We&rsquo;re actively expanding into this area. Check back
                                    soon for new communities.
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
