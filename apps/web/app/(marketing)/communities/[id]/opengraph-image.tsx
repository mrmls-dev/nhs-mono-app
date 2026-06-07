import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import regionsData from "@/data/regions.json";
import type { Community } from "@/components/CommunityCard";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const communities = regionsData.regions
    .flatMap((r) => r.counties)
    .flatMap((c) => c.communities) as unknown as Community[];

export default async function Image({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const community = communities.find((c) => c.id === id);

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

    const [logoResult, communityImgResult] = await Promise.allSettled([
        readFile(join(process.cwd(), "public", "images", "logo.png")),
        readFile(
            join(
                process.cwd(),
                "public",
                ...(community.image.startsWith("/")
                    ? community.image.slice(1)
                    : community.image
                ).split("/"),
            ),
        ),
    ]);

    // @ts-expect-error — Satori accepts ArrayBuffer/TypedArray as img src at runtime
    const logoSrc: string | undefined =
        logoResult.status === "fulfilled"
            ? Uint8Array.from(logoResult.value).buffer
            : undefined;

    // @ts-expect-error — Satori accepts ArrayBuffer/TypedArray as img src at runtime
    const imgSrc: string | undefined =
        communityImgResult.status === "fulfilled"
            ? Uint8Array.from(communityImgResult.value).buffer
            : undefined;

    const isSelling = community.status.toLowerCase().includes("now");
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
                    {community.floorPlans?.length && (
                        <span
                            style={{
                                color: "rgba(255,255,255,0.42)",
                                fontSize: "16px",
                                fontWeight: 500,
                                letterSpacing: "1.5px",
                                textTransform: "uppercase",
                            }}
                        >
                            {community.floorPlans?.length} Floor Plans Available
                        </span>
                    )}

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
                            {community.status}
                        </span>
                        <span style={{ color: "#c9a84c", fontSize: "26px", fontWeight: 700 }}>
                            From {community.priceFrom}
                        </span>
                    </div>

                    <span style={{ color: "rgba(255,255,255,0.42)", fontSize: "15px" }}>
                        {[community.beds, community.baths, community.garage].join(" · ")}
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
