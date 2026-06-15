/**
 * Starter themes agents can apply then tweak in the generator. Each is a full
 * {@link ThemeConfig}; the generator deep-copies the chosen preset into the
 * form so further edits don't mutate these constants.
 */
import type { ThemeConfig } from "./theme";

export type ThemePreset = {
    name: string;
    description: string;
    config: ThemeConfig;
};

export const THEME_PRESETS: ThemePreset[] = [
    {
        name: "Coastal",
        description: "Breezy blues — the platform default look.",
        config: {
            fonts: { heading: "poppins", body: "inter" },
            radius: 0.625,
            light: { primary: "#1d4ed8", secondary: "#f1f5f9", accent: "#e0f2fe" },
            dark: { primary: "#38bdf8", secondary: "#1e293b", accent: "#0c4a6e" },
        },
    },
    {
        name: "Modern",
        description: "Clean violet with tight, contemporary type.",
        config: {
            fonts: { heading: "jakarta", body: "dm-sans" },
            radius: 0.875,
            light: { primary: "#7c3aed", secondary: "#f5f3ff", accent: "#ede9fe" },
            dark: { primary: "#a78bfa", secondary: "#1e1b2e", accent: "#2e1065" },
        },
    },
    {
        name: "Classic",
        description: "Warm serif headings for an established, trusted feel.",
        config: {
            fonts: { heading: "playfair", body: "lora" },
            radius: 0.375,
            light: { primary: "#9a3412", secondary: "#f5f5f4", accent: "#fef3c7" },
            dark: { primary: "#fb923c", secondary: "#292524", accent: "#451a03" },
        },
    },
    {
        name: "Bold",
        description: "High-contrast emerald with condensed display headings.",
        config: {
            fonts: { heading: "oswald", body: "work-sans" },
            radius: 0.25,
            light: { primary: "#047857", secondary: "#f0fdf4", accent: "#d1fae5" },
            dark: { primary: "#34d399", secondary: "#0f291f", accent: "#064e3b" },
        },
    },
    {
        name: "Slate",
        description: "Understated neutral palette that lets photography lead.",
        config: {
            fonts: { heading: "manrope", body: "manrope" },
            radius: 0.75,
            light: { primary: "#334155", secondary: "#f1f5f9", accent: "#e2e8f0" },
            dark: { primary: "#94a3b8", secondary: "#1e293b", accent: "#334155" },
        },
    },
];
