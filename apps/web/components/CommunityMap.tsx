"use client";

import { useState } from "react";
import Map, {
    Marker,
    Popup,
    NavigationControl,
    FullscreenControl,
} from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import type { School } from "./CommunityCard";

export default function CommunityMap({
    name,
    coords,
    schools = [],
}: {
    name: string;
    coords: { lat: number; lng: number };
    schools?: School[];
}) {
    const [activeSchool, setActiveSchool] = useState<School | null>(null);

    const schoolsWithCoords = schools.filter(
        (s) => s.coords && (s.coords.lat !== 0 || s.coords.lng !== 0),
    );

    return (
        <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-border shadow-sm">
            <Map
                mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
                initialViewState={{
                    longitude: coords.lng,
                    latitude: coords.lat,
                    zoom: 14,
                }}
                style={{ width: "100%", height: "100%" }}
                mapStyle="mapbox://styles/mapbox/streets-v12"
                onClick={() => setActiveSchool(null)}
            >
                <NavigationControl position="top-right" showCompass={false} />
                <FullscreenControl position="top-right" />

                <Marker longitude={coords.lng} latitude={coords.lat} anchor="bottom">
                    <div className="flex flex-col items-center gap-0.5">
                        <div
                            className="flex items-center justify-center size-10 rounded-full shadow-lg text-xl"
                            style={{ background: "#c9a84c", color: "#0b1d3a" }}
                            title={name}
                        >
                            🏠
                        </div>
                        <div className="size-2 rounded-full" style={{ background: "#c9a84c" }} />
                    </div>
                </Marker>

                {schoolsWithCoords.map((s) => (
                    <Marker
                        key={s.name}
                        longitude={s.coords!.lng}
                        latitude={s.coords!.lat}
                        anchor="center"
                        onClick={(e) => {
                            e.originalEvent.stopPropagation();
                            setActiveSchool((prev) => (prev?.name === s.name ? null : s));
                        }}
                    >
                        <button
                            type="button"
                            aria-label={s.name}
                            className="flex items-center justify-center size-8 rounded-full shadow-md text-base hover:scale-110 transition-transform"
                            style={{ background: "#313a4d", color: "#ffffff" }}
                        >
                            🎓
                        </button>
                    </Marker>
                ))}

                {activeSchool?.coords && (
                    <Popup
                        longitude={activeSchool.coords.lng}
                        latitude={activeSchool.coords.lat}
                        anchor="bottom"
                        offset={16}
                        closeButton
                        onClose={() => setActiveSchool(null)}
                        maxWidth="200px"
                    >
                        <div className="p-1 flex flex-col gap-0.5">
                            <p className="font-bold text-sm text-gray-900">{activeSchool.name}</p>
                            <p className="text-xs text-gray-500">
                                {activeSchool.type} · Grades {activeSchool.grades}
                            </p>
                            <p className="text-xs text-gray-400">{activeSchool.distance} away</p>
                        </div>
                    </Popup>
                )}
            </Map>

            {schoolsWithCoords.length > 0 && (
                <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow text-xs flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                        <span
                            className="size-4 rounded-full flex items-center justify-center text-xs"
                            style={{ background: "#c9a84c" }}
                        >
                            🏠
                        </span>
                        <span className="text-gray-700">Community</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span
                            className="size-4 rounded-full flex items-center justify-center text-xs"
                            style={{ background: "#313a4d" }}
                        >
                            🎓
                        </span>
                        <span className="text-gray-700">School</span>
                    </div>
                </div>
            )}
        </div>
    );
}
