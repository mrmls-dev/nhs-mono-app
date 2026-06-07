import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt =
    "National House Search — New Construction Communities and Floor Plans in Southeast Florida";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
    const logoData = await readFile(
        join(process.cwd(), "public", "images", "logo.png"),
    );
    // @ts-expect-error — Satori accepts ArrayBuffer/TypedArray as img src at runtime
    const logoSrc: string = Uint8Array.from(logoData).buffer;

    return new ImageResponse(
        <div
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                background: "#0b1d3a",
                position: "relative",
            }}
        >
            {/* Left gold accent bar */}
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "8px",
                    height: "630px",
                    background: "#c9a84c",
                    display: "flex",
                }}
            />

            {/* Decorative ring */}
            <div
                style={{
                    position: "absolute",
                    top: -100,
                    right: -100,
                    width: "540px",
                    height: "540px",
                    borderRadius: "50%",
                    border: "70px solid rgba(201,168,76,0.06)",
                    display: "flex",
                }}
            />

            {/* Content */}
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    padding: "72px 92px",
                    width: "100%",
                    height: "100%",
                }}
            >
                {/* Logo badge */}
                <div
                    style={{
                        display: "flex",
                        background: "white",
                        borderRadius: "10px",
                        padding: "10px 20px",
                        alignSelf: "flex-start",
                    }}
                >
                    <img src={logoSrc} style={{ width: "303px", height: "138px" }} />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <h1
                        style={{
                            margin: 0,
                            color: "#ffffff",
                            fontSize: "84px",
                            fontWeight: 800,
                            lineHeight: 1,
                        }}
                    >
                        New Construction
                    </h1>
                    <p
                        style={{
                            margin: 0,
                            color: "rgba(255,255,255,0.58)",
                            fontSize: "48px",
                            fontWeight: 300,
                            lineHeight: 1,
                        }}
                    >
                        Communities and Floor Plans
                    </p>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "20px",
                            marginTop: "20px",
                        }}
                    >
                        <div
                            style={{
                                width: "72px",
                                height: "4px",
                                background: "#c9a84c",
                                display: "flex",
                            }}
                        />
                        <span style={{ color: "#c9a84c", fontSize: "22px", fontWeight: 500 }}>
                            Southeast Florida
                        </span>
                    </div>
                </div>
            </div>
        </div>,
        size,
    );
}
