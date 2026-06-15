/**
 * Per-agent color palette for OG / social-share cards. Pure color math with no
 * node/next imports, so it's safe to import from both the OG image routes
 * (`lib/og.ts`, server) and the dashboard live preview (client component).
 *
 * Colors are derived from the agent's brand theme so the social card matches
 * their site. The unbranded platform default keeps the original navy/gold card.
 */
import { resolveTheme } from "./theme";
import type { ThemeConfig } from "./theme";

export type OgPalette = {
    /** Card background — always dark so white text stays readable. */
    bg: string;
    /** Brand accent — thin rules, highlights, status pill. */
    accent: string;
};

/** The platform's signature card colors (navy + gold). */
const LEGACY: OgPalette = { bg: "#0b1d3a", accent: "#c9a84c" };

type PaletteSource = {
    theme?: ThemeConfig | null;
    brandColor?: string | null;
};

export function ogPalette(agent: PaletteSource): OgPalette {
    // Unbranded platform default → keep the original navy/gold card.
    if (!agent.theme && !agent.brandColor) return LEGACY;

    const primary = resolveTheme(agent).light.primary;
    // Blend the primary heavily toward near-black for a dark, brand-tinted
    // background that guarantees contrast with the white text/logo badge.
    return { bg: mix(primary, "#0a0e1a", 0.85), accent: primary };
}

/** Linear blend of two hex colors. `t` is the weight of `b` (0 → a, 1 → b). */
function mix(a: string, b: string, t: number): string {
    const ca = hexToRgb(a);
    const cb = hexToRgb(b);
    if (!ca || !cb) return a;
    const ch = (x: number, y: number) => Math.round(x + (y - x) * t);
    return rgbToHex(ch(ca.r, cb.r), ch(ca.g, cb.g), ch(ca.b, cb.b));
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
    if (!m) return null;
    const int = parseInt(m[1]!, 16);
    return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
}

function rgbToHex(r: number, g: number, b: number): string {
    return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}
