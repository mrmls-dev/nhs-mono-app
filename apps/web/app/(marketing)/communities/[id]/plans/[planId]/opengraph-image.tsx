import { ImageResponse } from "next/og";
import { getCommunity } from "@/api/community";
import { formatPrice } from "@/lib/format";
import { fetchImageDataUrl, resolveOgBrand } from "@/lib/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
    params,
}: {
    params: Promise<{ id: string; planId: string }>;
}) {
    const { id, planId } = await params;
    const community = await getCommunity(id).catch(() => null);
    const plan = community?.floorPlans.find((p) => p.slug === planId);

    if (!community || !plan) {
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
                    Floor Plan Not Found
                </span>
            </div>,
            size,
        );
    }

    const [{ logoSrc, palette }, imgSrc] = await Promise.all([
        resolveOgBrand(),
        fetchImageDataUrl(plan.image),
    ]);

    const specs = [
        `${plan.beds} Bd`,
        `${plan.baths} Ba`,
        `${plan.garage} Car`,
        plan.sqft ? `${plan.sqft.toLocaleString("en-US")} Sq Ft` : undefined,
    ]
        .filter(Boolean)
        .join(" · ");

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
                    <span style={{ color: "rgba(255,255,255,0.42)", fontSize: "16px" }}>
                        {community.name}
                    </span>
                    <span
                        style={{
                            color: "rgba(255,255,255,0.38)",
                            fontSize: "14px",
                            textTransform: "uppercase",
                            letterSpacing: "2.5px",
                            fontWeight: 600,
                        }}
                    >
                        Floor Plan
                    </span>
                    <h1
                        style={{
                            margin: 0,
                            color: "#ffffff",
                            fontSize: plan.name.length > 20 ? "52px" : "66px",
                            fontWeight: 800,
                            lineHeight: 1.05,
                        }}
                    >
                        {plan.name}
                    </h1>
                    {plan.startingPrice ? (
                        <span style={{ color: palette.accent, fontSize: "28px", fontWeight: 700 }}>
                            {formatPrice(plan.startingPrice)}
                        </span>
                    ) : null}
                    <div
                        style={{
                            width: "48px",
                            height: "3px",
                            background: palette.accent,
                            display: "flex",
                            marginTop: "4px",
                        }}
                    />
                    {specs && (
                        <span
                            style={{
                                color: "rgba(255,255,255,0.52)",
                                fontSize: "16px",
                                marginTop: "4px",
                            }}
                        >
                            {specs}
                        </span>
                    )}
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
