import { ImageResponse } from "next/og";
import { getCommunity } from "@/api/community";
import {
    formatRange,
    formatGarage,
    formatPrice,
    STATUS_LABELS,
} from "@/lib/format";
import { fetchImageDataUrl, resolveOgBrand } from "@/lib/og";
import { readableForeground } from "@/lib/theme";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

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

    const [{ logoSrc, palette }, imgSrc] = await Promise.all([
        resolveOgBrand(),
        fetchImageDataUrl(community.image),
    ]);

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
                background: palette.bg,
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
                    background: palette.accent,
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
                    background: palette.accent,
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
                        <img
                            src={logoSrc}
                            style={{
                                width: "303px",
                                height: "138px",
                                objectFit: "contain",
                            }}
                        />
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
                            background: palette.accent,
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
                                background: isSelling
                                    ? palette.accent
                                    : "rgba(255,255,255,0.1)",
                                color: isSelling
                                    ? readableForeground(palette.accent)
                                    : "#ffffff",
                                fontSize: "13px",
                                fontWeight: 700,
                                padding: "5px 14px",
                                borderRadius: "100px",
                            }}
                        >
                            {status}
                        </span>
                        <span style={{ color: palette.accent, fontSize: "26px", fontWeight: 700 }}>
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
