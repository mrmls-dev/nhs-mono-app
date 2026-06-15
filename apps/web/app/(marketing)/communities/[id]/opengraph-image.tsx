import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getCommunity } from "@/api/community";
import {
    formatRange,
    formatGarage,
    formatPrice,
    STATUS_LABELS,
} from "@/lib/format";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Fetch a remote (R2/CDN) image and return it as a base64 data URL for Satori.
 * Returns undefined on any failure so the card still renders without the photo.
 * Only absolute http(s) URLs are fetched — community/plan images are stored as
 * full R2 URLs, so nothing is read off the function's filesystem.
 */
async function fetchImageDataUrl(url: string): Promise<string | undefined> {
    if (!/^https?:\/\//.test(url)) return undefined;
    try {
        const res = await fetch(url);
        if (!res.ok) return undefined;
        const mime = res.headers.get("content-type") ?? "image/jpeg";
        const b64 = Buffer.from(await res.arrayBuffer()).toString("base64");
        return `data:${mime};base64,${b64}`;
    } catch {
        return undefined;
    }
}

export default async function Image({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const community = await getCommunity(id).catch(() => null);

    if (!community) {
        return new ImageResponse(
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    background: "#0b1d3a",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <span style={{ color: "#ffffff", fontSize: "40px" }}>
                    Community Not Found
                </span>
            </div>,
            size,
        );
    }

    const [logoBuf, imgSrc] = await Promise.all([
        readFile(join(process.cwd(), "public", "images", "logo.png")).catch(
            () => null,
        ),
        fetchImageDataUrl(community.image),
    ]);

    const logoSrc = logoBuf
        ? `data:image/png;base64,${logoBuf.toString("base64")}`
        : undefined;

    const isSelling = community.status === "NOW_SELLING";
    const status = STATUS_LABELS[community.status] ?? community.status;
    const specs = [
        formatRange(community.bedsMin, community.bedsMax, "Bed"),
        formatRange(community.bathsMin, community.bathsMax, "Bath"),
        formatGarage(community.garageMin, community.garageMax),
    ].join(" · ");
    const IMG_W = 500;

    return new ImageResponse(
        <div
            style={{
                width: "1200px",
                height: "630px",
                display: "flex",
                flexDirection: "row",
                background: "#0b1d3a",
                position: "relative",
            }}
        >
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "6px",
                    height: "630px",
                    background: "#c9a84c",
                    display: "flex",
                }}
            />
            <div
                style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    width: "1200px",
                    height: "4px",
                    background: "#c9a84c",
                    display: "flex",
                }}
            />

            <div
                style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    padding: "52px 72px 62px 82px",
                }}
            >
                {logoSrc && (
                    <div
                        style={{
                            display: "flex",
                            background: "white",
                            borderRadius: "8px",
                            padding: "8px 16px",
                            alignSelf: "flex-start",
                        }}
                    >
                        <img src={logoSrc} style={{ width: "303px", height: "138px" }} />
                    </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {community.floorPlans?.length ? (
                        <span
                            style={{
                                color: "rgba(255,255,255,0.42)",
                                fontSize: "16px",
                                fontWeight: 500,
                                letterSpacing: "1.5px",
                                textTransform: "uppercase",
                            }}
                        >
                            {community.floorPlans.length} Floor Plans Available
                        </span>
                    ) : null}

                    <h1
                        style={{
                            margin: 0,
                            color: "#ffffff",
                            fontSize: community.name.length > 22 ? "46px" : "58px",
                            fontWeight: 800,
                            lineHeight: 1.05,
                        }}
                    >
                        {community.name}
                    </h1>

                    <p
                        style={{
                            margin: 0,
                            color: "rgba(255,255,255,0.52)",
                            fontSize: "17px",
                            lineHeight: 1.4,
                        }}
                    >
                        {community.location}
                    </p>

                    <div
                        style={{
                            width: "48px",
                            height: "3px",
                            background: "#c9a84c",
                            display: "flex",
                            marginTop: "6px",
                        }}
                    />

                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "14px",
                            marginTop: "4px",
                            flexWrap: "wrap",
                        }}
                    >
                        <span
                            style={{
                                background: isSelling ? "#c9a84c" : "rgba(255,255,255,0.1)",
                                color: isSelling ? "#0b1d3a" : "#ffffff",
                                fontSize: "13px",
                                fontWeight: 700,
                                padding: "5px 14px",
                                borderRadius: "100px",
                            }}
                        >
                            {status}
                        </span>
                        <span style={{ color: "#c9a84c", fontSize: "26px", fontWeight: 700 }}>
                            From {formatPrice(community.priceFrom)}
                        </span>
                    </div>

                    <span style={{ color: "rgba(255,255,255,0.42)", fontSize: "15px" }}>
                        {specs}
                    </span>
                </div>
            </div>

            {imgSrc && (
                <img
                    src={imgSrc}
                    style={{
                        width: `${IMG_W}px`,
                        height: "630px",
                        objectFit: "cover",
                        flexShrink: 0,
                    }}
                />
            )}
        </div>,
        size,
    );
}
