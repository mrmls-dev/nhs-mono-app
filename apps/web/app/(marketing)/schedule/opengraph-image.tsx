import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "Schedule a Visit — National House Search";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
    const logob64 = await readFile(
        join(process.cwd(), "public/images/logo.png"),
        "base64",
    );
    const logoSrc = `data:image/png;base64,${logob64}`;

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
            <div
                style={{
                    position: "absolute",
                    bottom: -130,
                    right: -130,
                    width: "560px",
                    height: "560px",
                    borderRadius: "50%",
                    border: "70px solid rgba(201,168,76,0.06)",
                    display: "flex",
                }}
            />

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

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <span
                        style={{
                            color: "rgba(255,255,255,0.38)",
                            fontSize: "19px",
                            textTransform: "uppercase",
                            letterSpacing: "3px",
                            fontWeight: 500,
                        }}
                    >
                        New Construction · Southeast Florida
                    </span>
                    <h1
                        style={{
                            margin: 0,
                            color: "#ffffff",
                            fontSize: "84px",
                            fontWeight: 800,
                            lineHeight: 1,
                        }}
                    >
                        Schedule
                    </h1>
                    <h2
                        style={{
                            margin: 0,
                            color: "rgba(255,255,255,0.82)",
                            fontSize: "74px",
                            fontWeight: 800,
                            lineHeight: 1,
                        }}
                    >
                        a Visit
                    </h2>
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
                        <span style={{ color: "rgba(255,255,255,0.55)", fontSize: "20px" }}>
                            Book a tour with our team today
                        </span>
                    </div>
                </div>
            </div>
        </div>,
        size,
    );
}
