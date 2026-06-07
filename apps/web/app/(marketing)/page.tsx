import CommunitiesSection from "@/components/CommunitiesSection";

type HomeProps = { searchParams: Promise<{ county?: string }> };

export default async function Home({ searchParams }: HomeProps) {
    const { county } = await searchParams;
    return <CommunitiesSection countyId={county} />;
}
