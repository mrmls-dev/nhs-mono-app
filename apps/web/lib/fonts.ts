/**
 * Curated, self-hosted Google-font allowlist for the white-label theme
 * generator. Every font is loaded once via `next/font/google` with a CSS
 * variable and `preload: false` — the variable exists everywhere, but the
 * browser only fetches the glyphs of a font a tenant actually selects.
 *
 * The selected font keys live in a tenant's `ThemeConfig.fonts`; the apply
 * layer ([BrandThemeProvider]) maps them to these CSS variables.
 */
import {
    Roboto,
    Inter,
    Poppins,
    Montserrat,
    Open_Sans,
    Lato,
    Work_Sans,
    Nunito,
    Plus_Jakarta_Sans,
    DM_Sans,
    Manrope,
    Playfair_Display,
    Merriweather,
    Lora,
    Source_Serif_4,
    Oswald,
    JetBrains_Mono,
} from "next/font/google";

// next/font requires each loader to be called at module scope with fully static
// literal options (no spreads). Most fonts here are variable (full weight axis,
// no `weight` needed) — only the static families (Roboto, Poppins, Lato) set
// their supported weights. `preload: false` so glyphs load only when selected.
const roboto = Roboto({ subsets: ["latin"], display: "swap", preload: false, weight: ["300", "400", "500", "700"], variable: "--font-roboto" });
const inter = Inter({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-inter" });
const poppins = Poppins({ subsets: ["latin"], display: "swap", preload: false, weight: ["400", "500", "600", "700"], variable: "--font-poppins" });
const montserrat = Montserrat({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-montserrat" });
const openSans = Open_Sans({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-open-sans" });
const lato = Lato({ subsets: ["latin"], display: "swap", preload: false, weight: ["400", "700"], variable: "--font-lato" });
const workSans = Work_Sans({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-work-sans" });
const nunito = Nunito({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-nunito" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-jakarta" });
const dmSans = DM_Sans({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-dm-sans" });
const manrope = Manrope({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-manrope" });
const playfair = Playfair_Display({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-playfair" });
const merriweather = Merriweather({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-merriweather" });
const lora = Lora({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-lora" });
const sourceSerif = Source_Serif_4({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-source-serif" });
const oswald = Oswald({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-oswald" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-jetbrains" });

export type FontCategory = "sans" | "serif" | "display" | "mono";

export type FontDef = {
    /** Stable key persisted in the tenant theme. */
    key: string;
    /** Human label shown in the picker. */
    label: string;
    category: FontCategory;
    /** CSS custom property the font's glyphs are bound to. */
    cssVar: string;
    /** `next/font` className that declares the CSS variable. */
    variable: string;
};

export const FONTS: FontDef[] = [
    { key: "roboto", label: "Roboto", category: "sans", cssVar: "--font-roboto", variable: roboto.variable },
    { key: "inter", label: "Inter", category: "sans", cssVar: "--font-inter", variable: inter.variable },
    { key: "poppins", label: "Poppins", category: "sans", cssVar: "--font-poppins", variable: poppins.variable },
    { key: "montserrat", label: "Montserrat", category: "sans", cssVar: "--font-montserrat", variable: montserrat.variable },
    { key: "open-sans", label: "Open Sans", category: "sans", cssVar: "--font-open-sans", variable: openSans.variable },
    { key: "lato", label: "Lato", category: "sans", cssVar: "--font-lato", variable: lato.variable },
    { key: "work-sans", label: "Work Sans", category: "sans", cssVar: "--font-work-sans", variable: workSans.variable },
    { key: "nunito", label: "Nunito", category: "sans", cssVar: "--font-nunito", variable: nunito.variable },
    { key: "jakarta", label: "Plus Jakarta Sans", category: "sans", cssVar: "--font-jakarta", variable: jakarta.variable },
    { key: "dm-sans", label: "DM Sans", category: "sans", cssVar: "--font-dm-sans", variable: dmSans.variable },
    { key: "manrope", label: "Manrope", category: "sans", cssVar: "--font-manrope", variable: manrope.variable },
    { key: "playfair", label: "Playfair Display", category: "serif", cssVar: "--font-playfair", variable: playfair.variable },
    { key: "merriweather", label: "Merriweather", category: "serif", cssVar: "--font-merriweather", variable: merriweather.variable },
    { key: "lora", label: "Lora", category: "serif", cssVar: "--font-lora", variable: lora.variable },
    { key: "source-serif", label: "Source Serif", category: "serif", cssVar: "--font-source-serif", variable: sourceSerif.variable },
    { key: "oswald", label: "Oswald", category: "display", cssVar: "--font-oswald", variable: oswald.variable },
    { key: "jetbrains", label: "JetBrains Mono", category: "mono", cssVar: "--font-jetbrains", variable: jetbrainsMono.variable },
];

export const FONT_BY_KEY: Record<string, FontDef> = Object.fromEntries(
    FONTS.map((f) => [f.key, f]),
);

/** A generic CSS fallback stack per category, appended after the chosen font. */
export const FONT_FALLBACK: Record<FontCategory, string> = {
    sans: "ui-sans-serif, system-ui, sans-serif",
    serif: "ui-serif, Georgia, serif",
    display: "ui-sans-serif, system-ui, sans-serif",
    mono: "ui-monospace, SFMono-Regular, monospace",
};

/** Space-joined className of every font variable — applied once on `<body>`. */
export const fontVariables = FONTS.map((f) => f.variable).join(" ");

/** Resolve a font key to a `font-family` value (CSS var + fallback stack). */
export function fontFamilyForKey(key: string): string {
    const font = FONT_BY_KEY[key];
    if (!font) return "var(--font-sans)";
    return `var(${font.cssVar}), ${FONT_FALLBACK[font.category]}`;
}

/** Fonts grouped by category, for rendering an optgroup-style picker. */
export const FONTS_BY_CATEGORY = FONTS.reduce<Record<FontCategory, FontDef[]>>(
    (acc, font) => {
        (acc[font.category] ??= []).push(font);
        return acc;
    },
    {} as Record<FontCategory, FontDef[]>,
);
