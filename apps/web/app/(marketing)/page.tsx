import { headers } from "next/headers";
import { getPublicCounties } from "@/api/county";
import { getAgentByDomain } from "@/api/agent";
import CommunitiesSection from "@/components/CommunitiesSection";
import type { CountyBounds } from "@/components/ListingMap";

type HomeProps = { searchParams: Promise<{ county?: string }> };

export default async function Home({ searchParams }: HomeProps) {
    const { county } = await searchParams;

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
        />
    );
}
