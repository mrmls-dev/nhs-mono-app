import { headers } from "next/headers";
import { getPublicCounties } from "@/api/county";
import { getAgentByDomain } from "@/api/agent";
import CommunitiesSection from "@/components/CommunitiesSection";
import type { CountyBounds } from "@/components/ListingMap";

type CommunitiesProps = {
    searchParams: Promise<{
        county?: string;
        beds?: string;
        baths?: string;
        priceMax?: string;
    }>;
};

export default async function CommunitiesPage({
    searchParams,
}: CommunitiesProps) {
    const { county, beds, baths, priceMax } = await searchParams;

    const bedsMin = beds ? Number(beds) : undefined;
    const bathsMin = baths ? Number(baths) : undefined;
    const priceCeil = priceMax ? Number(priceMax) : undefined;

    // Resolve the agent for this request so the catalog is scoped to its
    // assigned counties + visible communities.
    const host = (await headers()).get("host") ?? undefined;
    const agent = await getAgentByDomain(host);

    let countyName: string | undefined;
    let countyBounds: CountyBounds | undefined;

    if (county) {
        const counties = await getPublicCounties(agent.id);
        const found = counties.find((c) => c.id === county);
        if (found) {
            countyName = found.name;
            countyBounds = {
                north: found.boundsNorth,
                south: found.boundsSouth,
                east: found.boundsEast,
                west: found.boundsWest,
            };
        }
    }

    return (
        <CommunitiesSection
            agentId={agent.id}
            countyId={county}
            countyBounds={countyBounds}
            countyName={countyName}
            mapboxToken={agent.mapboxToken}
            bedsMin={Number.isFinite(bedsMin) ? bedsMin : undefined}
            bathsMin={Number.isFinite(bathsMin) ? bathsMin : undefined}
            priceMax={Number.isFinite(priceCeil) ? priceCeil : undefined}
        />
    );
}
