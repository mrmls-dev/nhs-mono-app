import Link from "next/link";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";

export type GalleryItem = {
    type: "image" | "video";
    src: string;
    alt: string;
    caption?: string;
    poster?: string;
};

export type School = {
    name: string;
    type: string;
    grades: string;
    distance: string;
    coords?: { lat: number; lng: number };
};

export type FloorPlan = {
    id: string;
    name: string;
    startingPrice: string;
    beds: string;
    baths: string;
    garage: string;
    stories: string;
    sqft: string;
    image: string;
    description?: string;
    diagramImage?: string;
    gallery?: GalleryItem[];
};

export type Community = {
    id: string;
    slug: string;
    name: string;
    brand?: string;
    propertyType?: string;
    location: string;
    image: string;
    status: string;
    homesForSale: number;
    beds: string;
    baths: string;
    garage: string;
    stories: string;
    sqftFrom: string;
    priceFrom: string;
    coords?: { lat: number; lng: number };
    about?: string;
    gallery?: GalleryItem[];
    amenities?: string[];
    schools?: School[];
    floorPlans?: FloorPlan[];
};

export default function CommunityCard({ community }: { community: Community }) {
    const isSelling = community.status.toLowerCase().includes("now");

    return (
        <Link href={`/communities/${community.slug}`} className="group block">
            <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row">
                    <div className="relative sm:w-2/5 aspect-4/3 sm:aspect-auto bg-muted overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={community.image}
                            alt={community.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <Badge
                            className={`absolute top-3 left-3 rounded-full ${
                                isSelling
                                    ? "bg-primary text-primary-foreground hover:bg-primary"
                                    : "bg-secondary text-secondary-foreground hover:bg-secondary"
                            }`}
                        >
                            {community.status}
                        </Badge>
                    </div>

                    <CardContent className="flex-1 p-5 flex flex-col gap-2">
                        <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                            {community.name}
                        </h3>

                        <p className="text-sm text-muted-foreground">
                            {community.location}
                        </p>

                        <p className="text-sm font-semibold text-primary">
                            {community.floorPlans?.length || 0} Floor Plans Available
                        </p>

                        <p className="text-sm text-foreground">
                            {community.beds}
                            <span className="mx-2 text-border">|</span>
                            {community.baths}
                            <span className="mx-2 text-border">|</span>
                            {community.garage}
                        </p>

                        <p className="text-sm text-foreground">
                            {community.stories}
                            <span className="mx-2 text-border">|</span>
                            From {community.sqftFrom} Sq. Ft.
                        </p>

                        <div className="mt-auto pt-3 border-t border-border">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">
                                Pricing starting from
                            </p>
                            <p className="text-2xl font-bold text-foreground">
                                From {community.priceFrom}
                            </p>
                        </div>
                    </CardContent>
                </div>
            </Card>
        </Link>
    );
}
