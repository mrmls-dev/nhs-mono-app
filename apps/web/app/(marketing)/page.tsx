import { getCounties } from "@/api/county";
import CommunitiesSection from "@/components/CommunitiesSection";
import type { CountyBounds } from "@/components/ListingMap";

type HomeProps = { searchParams: Promise<{ county?: string }> };

export default async function Home({ searchParams }: HomeProps) {
    const { county } = await searchParams;

    let countyName: string | undefined;
    let countyBounds: CountyBounds | undefined;

    if (county) {
        const counties = await getCounties();
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
            countyId={county}
            countyBounds={countyBounds}
            countyName={countyName}
        />
    );
}
