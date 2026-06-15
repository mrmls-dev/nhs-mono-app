/**
 * White-label theme model + the single serializer that turns a `ThemeConfig`
 * into the scoped CSS the public site (and the dashboard live preview) apply.
 *
 * Only the three core colors split per light/dark mode; radius and fonts are
 * shared. Color foregrounds are derived from luminance so agents never produce
 * an unreadable pairing.
 */
import { fontFamilyForKey } from "./fonts";

export type FontKey = string;

export type ThemeColors = {
    primary: string; // hex
    secondary: string; // hex
    accent: string; // hex
};

export type ThemeConfig = {
    fonts: { heading: FontKey; body: FontKey };
    radius: number; // rem
    light: ThemeColors;
    dark: ThemeColors;
};

/** Near-black / near-white, matching the tone of the base shadcn tokens. */
const FG_DARK = "#0a0a0a";
const FG_LIGHT = "#fafafa";

export const DEFAULT_THEME: ThemeConfig = {
    fonts: { heading: "roboto", body: "roboto" },
    radius: 0.625,
    light: { primary: "#1d4ed8", secondary: "#f1f5f9", accent: "#eef2ff" },
    dark: { primary: "#3b82f6", secondary: "#1e293b", accent: "#1e293b" },
};

/** Pick a readable foreground (near-black/near-white) for a hex background. */
export function readableForeground(hex: string): string {
    const rgb = hexToRgb(hex);
    if (!rgb) return FG_DARK;
    // Relative luminance (sRGB, gamma-corrected).
    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((c) => {
        const s = c / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    }) as [number, number, number];
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luminance > 0.45 ? FG_DARK : FG_LIGHT;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
    if (!m) return null;
    const int = parseInt(m[1]!, 16);
    return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
}

/** The token declarations for one color mode (no selector). */
function colorBlock(c: ThemeColors): string {
    return [
        `--primary:${c.primary}`,
        `--primary-foreground:${readableForeground(c.primary)}`,
        `--secondary:${c.secondary}`,
        `--secondary-foreground:${readableForeground(c.secondary)}`,
        `--accent:${c.accent}`,
        `--accent-foreground:${readableForeground(c.accent)}`,
        `--ring:${c.primary}`,
        `--sidebar-primary:${c.primary}`,
    ].join(";");
}

/**
 * Serialize a theme to scoped CSS. The light block sets colors + radius + fonts
 * on `scope`; the dark block re-sets only colors and matches whether `.dark` is
 * an ancestor (public site via next-themes) or on the scope element itself
 * (live preview toggle).
 */
export function themeToCss(theme: ThemeConfig, scope = "[data-brand]"): string {
    const bodyFamily = fontFamilyForKey(theme.fonts.body);
    const headingFamily = fontFamilyForKey(theme.fonts.heading);

    const light = [
        colorBlock(theme.light),
        `--radius:${theme.radius}rem`,
        `--font-sans:${bodyFamily}`,
        `--font-heading:${headingFamily}`,
        `font-family:${bodyFamily}`,
    ].join(";");

    return [
        `${scope}{${light}}`,
        `.dark ${scope},${scope}.dark{${colorBlock(theme.dark)}}`,
    ].join("\n");
}

/** Minimal agent shape needed to resolve a theme. */
type ThemeSource = { theme?: ThemeConfig | null; brandColor?: string | null };

/** Legacy single-color agents get a theme derived from their `brandColor`. */
export function fromBrandColor(brandColor: string | null | undefined): ThemeConfig {
    if (!brandColor) return DEFAULT_THEME;
    return {
        ...DEFAULT_THEME,
        light: { ...DEFAULT_THEME.light, primary: brandColor },
        dark: { ...DEFAULT_THEME.dark, primary: brandColor },
    };
}

/** Resolve the theme to apply for an agent, falling back to legacy brandColor. */
export function resolveTheme(agent: ThemeSource): ThemeConfig {
    return agent.theme ?? fromBrandColor(agent.brandColor);
}
