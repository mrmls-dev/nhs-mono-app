import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { headers } from "next/headers";
import { getAgentByDomain } from "@/api/agent";
import { ogPalette, type OgPalette } from "./og-theme";

/**
 * Resolve the brand bits for OG / social-share cards from the request Host:
 * the agent's logo (as a base64 data URL) and a color palette derived from
 * their theme. The agent is fetched once and reused for both.
 *
 * Reading `headers()` opts the OG route out of static generation — required so
 * every white-label host renders its own card instead of a shared, cached one.
 */
export async function resolveOgBrand(): Promise<{
    logoSrc: string | undefined;
    palette: OgPalette;
}> {
    const host = (await headers()).get("host") ?? undefined;
    const agent = await getAgentByDomain(host).catch(() => null);

    const palette = ogPalette(agent ?? {});
    const logoSrc = await resolveLogoSrc(agent?.logo ?? null);
    return { logoSrc, palette };
}

/** Inline the agent's uploaded logo (absolute R2/CDN URL); else the platform logo. */
async function resolveLogoSrc(logo: string | null): Promise<string | undefined> {
    if (logo && /^https?:\/\//.test(logo)) {
        const remote = await fetchImageDataUrl(logo);
        if (remote) return remote;
    }
    const local = await readFile(
        join(process.cwd(), "public", "images", "logo.png"),
    ).catch(() => null);
    return local
        ? `data:image/png;base64,${local.toString("base64")}`
        : undefined;
}

/**
 * Fetch a remote image and return it as a base64 data URL for Satori. Returns
 * undefined on any failure so the caller can fall back. Only absolute http(s)
 * URLs are fetched — nothing is read off the function's filesystem.
 */
export async function fetchImageDataUrl(
    url: string,
): Promise<string | undefined> {
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
