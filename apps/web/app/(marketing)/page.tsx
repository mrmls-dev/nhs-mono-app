import { headers } from "next/headers";
import { getAgentByDomain } from "@/api/agent";
import { getPublicCounties } from "@/api/county";
import { getPublicCommunities } from "@/api/community";
import { formatPrice, formatRange } from "@/lib/format";
import HomeHero from "@/components/HomeHero";
import HomeTrustStats from "@/components/HomeTrustStats";
import HomeWhyNewConstruction from "@/components/HomeWhyNewConstruction";
import HomeMonthlySavings from "@/components/HomeMonthlySavings";
import HomeFaq from "@/components/HomeFaq";
import HomeFeaturedCommunities, {
    type FeaturedCommunity,
} from "@/components/HomeFeaturedCommunities";
import HomeHowItWorks from "@/components/HomeHowItWorks";
import HomeBlog from "@/components/HomeBlog";
import HomeCtaBand from "@/components/HomeCtaBand";
import type { CountyOption } from "@/lib/home-data";

export default async function Home() {
    // Resolve the agent so the survey is attributed to this tenant, and its
    // location step + featured communities come from the agent's catalog.
    let agentId: string | undefined;
    let counties: CountyOption[] | undefined;
    let featured: FeaturedCommunity[] = [];

    try {
        const host = (await headers()).get("host") ?? undefined;
        const agent = await getAgentByDomain(host);
        agentId = agent.id;

        const [countyList, communities] = await Promise.all([
            getPublicCounties(agent.id),
            getPublicCommunities(agent.id),
        ]);

        counties = countyList.map((c) => ({ id: c.id, name: c.name }));

        featured = communities
            .filter((c) => c.status === "NOW_SELLING")
            .slice(0, 3)
            .map((c) => {
                const hasPlans = c._count.floorPlans > 0;
                return {
                    slug: c.slug,
                    name: c.name,
                    location: c.location,
                    image: c.image,
                    county: c.county?.name ?? "",
                    beds: hasPlans
                        ? formatRange(c.bedsMin, c.bedsMax, "Bed")
                        : "—",
                    plans: c._count.floorPlans,
                    priceFrom: hasPlans ? formatPrice(c.priceFrom) : "—",
                };
            });
    } catch {
        // API/agent unavailable — render the page without live data.
    }

    return (
        <main className="flex flex-col">
            <HomeHero counties={counties} agentId={agentId} />
            <HomeTrustStats />
            <HomeWhyNewConstruction />
            <HomeMonthlySavings />
            {featured.length > 0 && (
                <HomeFeaturedCommunities communities={featured} />
            )}
            <HomeHowItWorks />
            <HomeFaq />
            <HomeBlog />
            <HomeCtaBand />
        </main>
    );
}
