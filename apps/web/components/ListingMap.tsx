"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Map, {
    Marker,
    Popup,
    NavigationControl,
    Source,
    Layer,
} from "react-map-gl/mapbox";
import type { MapRef } from "react-map-gl/mapbox";
import Link from "next/link";
import "mapbox-gl/dist/mapbox-gl.css";

export type CommunityPin = {
    id: string;
    name: string;
    location: string;
    status: string;
    priceFrom: string;
    image: string;
    coords: { lat: number; lng: number };
};

export type CountyBounds = {
    west: number;
    east: number;
    south: number;
    north: number;
};

function PinIcon({ active }: { active: boolean }) {
    return (
        <svg
            width="32"
            height="40"
            viewBox="0 0 32 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.35))" }}
        >
            <path
                d="M16 0C7.163 0 0 7.163 0 16c0 10.5 14 24 16 24s16-13.5 16-24C32 7.163 24.837 0 16 0z"
                fill={active ? "#313a4d" : "#c9a84c"}
            />
            <circle cx="16" cy="16" r="6" fill={active ? "#ffffff" : "#0b1d3a"} />
        </svg>
    );
}

function boundsToGeoJson(b: CountyBounds) {
    return {
        type: "Feature" as const,
        geometry: {
            type: "Polygon" as const,
            coordinates: [
                [
                    [b.west, b.south],
                    [b.west, b.north],
                    [b.east, b.north],
                    [b.east, b.south],
                    [b.west, b.south],
                ],
            ],
        },
        properties: {},
    };
}

const SE_FL = { longitude: -80.3, latitude: 26.35, zoom: 7.75 } as const;

export default function ListingMap({
    communities,
    countyBounds,
}: {
    communities: CommunityPin[];
    countyBounds?: CountyBounds;
}) {
    const [activeId, setActiveId] = useState<string | null>(null);
    const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const mapRef = useRef<MapRef>(null);

    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;
        if (countyBounds) {
            map.fitBounds(
                [
                    [countyBounds.west, countyBounds.south],
                    [countyBounds.east, countyBounds.north],
                ],
                { padding: 60, duration: 800 },
            );
        } else {
            map.flyTo({ center: [SE_FL.longitude, SE_FL.latitude], zoom: SE_FL.zoom, duration: 800 });
        }
    }, [countyBounds]);

    const active = communities.find((c) => c.id === activeId) ?? null;

    const show = useCallback((id: string) => {
        if (hideTimer.current) clearTimeout(hideTimer.current);
        setActiveId(id);
    }, []);

    const scheduleHide = useCallback(() => {
        hideTimer.current = setTimeout(() => setActiveId(null), 120);
    }, []);

    const cancelHide = useCallback(() => {
        if (hideTimer.current) clearTimeout(hideTimer.current);
    }, []);

    const validCommunities = communities.filter(
        (c) => c.coords && (c.coords.lat !== 0 || c.coords.lng !== 0),
    );

    const isSelling = (status: string) => status.toLowerCase().includes("now");

    const initialViewState = countyBounds
        ? {
              bounds: [
                  [countyBounds.west, countyBounds.south],
                  [countyBounds.east, countyBounds.north],
              ] as [[number, number], [number, number]],
              fitBoundsOptions: { padding: 60 },
          }
        : SE_FL;

    const countyOutline = countyBounds ? boundsToGeoJson(countyBounds) : null;

    return (
        <Map
            ref={mapRef}
            mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
            initialViewState={initialViewState}
            style={{ width: "100%", height: "100%" }}
            mapStyle="mapbox://styles/mapbox/streets-v12"
            onClick={() => setActiveId(null)}
        >
            <NavigationControl position="top-right" showCompass={false} />

            {countyOutline && (
                <Source id="county-outline" type="geojson" data={countyOutline}>
                    <Layer
                        id="county-fill"
                        type="fill"
                        paint={{ "fill-color": "#c9a84c", "fill-opacity": 0.07 }}
                    />
                    <Layer
                        id="county-border"
                        type="line"
                        paint={{
                            "line-color": "#c9a84c",
                            "line-width": 2.5,
                            "line-dasharray": [5, 3],
                        }}
                    />
                </Source>
            )}

            {validCommunities.map((c) => (
                <Marker
                    key={c.id}
                    longitude={c.coords.lng}
                    latitude={c.coords.lat}
                    anchor="bottom"
                >
                    <div
                        onMouseEnter={() => show(c.id)}
                        onMouseLeave={scheduleHide}
                        className="cursor-pointer transition-transform hover:scale-110"
                    >
                        <PinIcon active={activeId === c.id} />
                    </div>
                </Marker>
            ))}

            {active && (
                <Popup
                    longitude={active.coords.lng}
                    latitude={active.coords.lat}
                    anchor="bottom"
                    offset={44}
                    closeButton={false}
                    onClose={() => setActiveId(null)}
                    maxWidth="260px"
                >
                    <div
                        className="flex flex-col overflow-hidden rounded-lg -m-2.5"
                        onMouseEnter={cancelHide}
                        onMouseLeave={scheduleHide}
                    >
                        {active.image && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={active.image}
                                alt={active.name}
                                className="w-full h-32 object-cover"
                            />
                        )}
                        <div className="p-3 flex flex-col gap-1.5 bg-white">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-sm text-gray-900">
                                    {active.name}
                                </span>
                                <span
                                    className="px-2 py-0.5 rounded-full text-xs font-semibold"
                                    style={
                                        isSelling(active.status)
                                            ? { background: "#c9a84c", color: "#0b1d3a" }
                                            : { background: "#313a4d", color: "#ffffff" }
                                    }
                                >
                                    {active.status}
                                </span>
                            </div>
                            <p className="text-xs text-gray-500">{active.location}</p>
                            {active.priceFrom && (
                                <p className="text-sm font-bold text-gray-900">
                                    From {active.priceFrom}
                                </p>
                            )}
                            <Link
                                href={`/communities/${active.id}`}
                                className="mt-1 text-center text-xs font-semibold py-1.5 rounded-md transition-opacity hover:opacity-90"
                                style={{ background: "#c9a84c", color: "#0b1d3a" }}
                            >
                                View Community →
                            </Link>
                        </div>
                    </div>
                </Popup>
            )}
        </Map>
    );
}
