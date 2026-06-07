"use client";

import { useState, useCallback } from "react";
import Lightbox from "yet-another-react-lightbox";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Video from "yet-another-react-lightbox/plugins/video";
import Counter from "yet-another-react-lightbox/plugins/counter";
import Captions from "yet-another-react-lightbox/plugins/captions";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import "yet-another-react-lightbox/plugins/counter.css";
import "yet-another-react-lightbox/plugins/captions.css";
import type { GalleryItem } from "./CommunityCard";

type Slide =
    | { type: "image"; src: string; alt: string; title?: string }
    | {
          type: "video";
          sources: { src: string; type: string }[];
          poster?: string;
          alt: string;
          title?: string;
      };

function toSlides(items: GalleryItem[]): Slide[] {
    return items.map((item) => {
        if (item.type === "video") {
            return {
                type: "video",
                sources: [{ src: item.src, type: "video/mp4" }],
                poster: item.poster,
                alt: item.alt,
                title: item.caption,
            };
        }
        return { type: "image", src: item.src, alt: item.alt, title: item.caption };
    });
}

function Thumb({
    item,
    index,
    fallback,
    onOpen,
    overlay,
}: {
    item: GalleryItem;
    index: number;
    fallback: string;
    onOpen: (i: number) => void;
    overlay?: React.ReactNode;
}) {
    const src = item.type === "video" ? (item.poster ?? fallback) : item.src;
    return (
        <button
            type="button"
            onClick={() => onOpen(index)}
            className="relative w-full h-full bg-muted overflow-hidden group focus-visible:outline-2 focus-visible:outline-primary"
            aria-label={item.alt}
        >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={src}
                alt={item.alt}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {item.type === "video" && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <span className="size-10 rounded-full bg-white/90 flex items-center justify-center text-foreground text-base pl-0.5">
                        ▶
                    </span>
                </span>
            )}
            {overlay}
        </button>
    );
}

export default function CommunityGallery({
    items,
    fallbackImage,
    communityName,
}: {
    items: GalleryItem[];
    fallbackImage: string;
    communityName: string;
}) {
    const gallery: GalleryItem[] =
        items.length > 0
            ? items
            : [{ type: "image", src: fallbackImage, alt: communityName }];

    const slides = toSlides(gallery);

    const [open, setOpen] = useState(false);
    const [index, setIndex] = useState(0);

    const openAt = useCallback((i: number) => {
        setIndex(i);
        setOpen(true);
    }, []);

    const hero = gallery[0]!;
    const side = gallery.slice(1, 5);
    const bottom = gallery.slice(5, 9);
    const totalVisible = 1 + side.length + bottom.length;
    const remaining = gallery.length - totalVisible;

    const lastSideIndex = side.length > 0 ? side.length - 1 : -1;
    const lastBottomIndex = bottom.length > 0 ? bottom.length - 1 : -1;
    const showOverlayOnBottom = bottom.length > 0 && remaining > 0;
    const showOverlayOnSide = side.length > 0 && remaining > 0 && !showOverlayOnBottom;

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">{gallery.length}</span>{" "}
                    {gallery.length === 1 ? "photo" : "photos"}
                </p>
                <button
                    type="button"
                    onClick={() => openAt(0)}
                    className="text-sm font-semibold text-primary hover:underline"
                >
                    View all photos →
                </button>
            </div>

            {/* Mobile gallery */}
            <div className="md:hidden flex flex-col gap-1 rounded-xl overflow-hidden">
                <div className="aspect-video w-full">
                    <Thumb item={hero} index={0} fallback={fallbackImage} onOpen={openAt} />
                </div>
                {gallery.length > 1 && (
                    <div className="grid grid-cols-2 gap-1 h-32">
                        <div className="relative overflow-hidden">
                            <Thumb item={gallery[1]!} index={1} fallback={fallbackImage} onOpen={openAt} />
                        </div>
                        <div className="relative overflow-hidden">
                            {gallery.length > 2 ? (
                                <Thumb
                                    item={gallery[2]!}
                                    index={2}
                                    fallback={fallbackImage}
                                    onOpen={openAt}
                                    overlay={
                                        gallery.length > 3 ? (
                                            <span className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white font-bold text-lg gap-0.5">
                                                <span>+{gallery.length - 3}</span>
                                                <span className="text-xs font-normal">more</span>
                                            </span>
                                        ) : undefined
                                    }
                                />
                            ) : (
                                <Thumb item={gallery[1]!} index={1} fallback={fallbackImage} onOpen={openAt} />
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Desktop gallery */}
            <div className="hidden md:grid grid-cols-4 grid-rows-3 gap-1.5 h-135 rounded-xl overflow-hidden">
                <div className="col-span-3 row-span-2">
                    <Thumb item={hero} index={0} fallback={fallbackImage} onOpen={openAt} />
                </div>

                {side.slice(0, 2).map((item, i) => (
                    <div key={`side-${i}`} className="col-span-1 row-span-1">
                        <Thumb
                            item={item}
                            index={i + 1}
                            fallback={fallbackImage}
                            onOpen={openAt}
                            overlay={
                                showOverlayOnSide && i === lastSideIndex && lastSideIndex < 2 ? (
                                    <span className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white font-bold text-lg gap-0.5">
                                        <span>+{remaining}</span>
                                        <span className="text-xs font-normal">more</span>
                                    </span>
                                ) : undefined
                            }
                        />
                    </div>
                ))}

                {bottom.map((item, i) => (
                    <div key={`bottom-${i}`} className="col-span-1 row-span-1">
                        <Thumb
                            item={item}
                            index={i + 5}
                            fallback={fallbackImage}
                            onOpen={openAt}
                            overlay={
                                showOverlayOnBottom && i === lastBottomIndex ? (
                                    <span className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white font-bold text-lg gap-0.5">
                                        <span>+{remaining}</span>
                                        <span className="text-xs font-normal">more</span>
                                    </span>
                                ) : undefined
                            }
                        />
                    </div>
                ))}

                {bottom.length === 0 &&
                    side.slice(2, 4).map((item, i) => (
                        <div key={`side-extra-${i}`} className="col-span-1 row-span-1">
                            <Thumb
                                item={item}
                                index={i + 3}
                                fallback={fallbackImage}
                                onOpen={openAt}
                                overlay={
                                    showOverlayOnSide && i + 2 === lastSideIndex ? (
                                        <span className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white font-bold text-lg gap-0.5">
                                            <span>+{remaining}</span>
                                            <span className="text-xs font-normal">more</span>
                                        </span>
                                    ) : undefined
                                }
                            />
                        </div>
                    ))}
            </div>

            <Lightbox
                open={open}
                close={() => setOpen(false)}
                index={index}
                slides={slides}
                plugins={[Captions, Counter, Thumbnails, Zoom, Video]}
                counter={{ container: { style: { top: "unset", bottom: 0, left: "50%", transform: "translateX(-50%)", fontSize: "0.875rem" } } }}
                thumbnails={{
                    position: "bottom",
                    width: 120,
                    height: 80,
                    gap: 8,
                    border: 2,
                    borderRadius: 6,
                    padding: 4,
                }}
                zoom={{ maxZoomPixelRatio: 3 }}
            />
        </div>
    );
}
