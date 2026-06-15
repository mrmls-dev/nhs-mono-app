"use client";

import { useState } from "react";
import { Moon, Sun } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@workspace/ui/components/select";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { cn } from "@workspace/ui/lib/utils";
import {
    FONTS_BY_CATEGORY,
    FONT_BY_KEY,
    type FontCategory,
} from "@/lib/fonts";
import { themeToCss, type ThemeColors, type ThemeConfig } from "@/lib/theme";
import { THEME_PRESETS } from "@/lib/theme-presets";

const HEX = /^#([0-9a-fA-F]{6})$/;

const CATEGORY_LABEL: Record<FontCategory, string> = {
    sans: "Sans-serif",
    serif: "Serif",
    display: "Display",
    mono: "Monospace",
};

const COLOR_KEYS: { key: keyof ThemeColors; label: string }[] = [
    { key: "primary", label: "Primary" },
    { key: "secondary", label: "Secondary" },
    { key: "accent", label: "Accent" },
];

export function ThemeGenerator({
    value,
    onChange,
}: {
    value: ThemeConfig;
    onChange: (next: ThemeConfig) => void;
}) {
    const [mode, setMode] = useState<"light" | "dark">("light");
    const [previewDark, setPreviewDark] = useState(false);

    const applyPreset = (config: ThemeConfig) =>
        onChange(structuredClone(config));

    const setFont = (slot: "heading" | "body", key: string) =>
        onChange({ ...value, fonts: { ...value.fonts, [slot]: key } });

    const setColor = (key: keyof ThemeColors, hex: string) =>
        onChange({ ...value, [mode]: { ...value[mode], [key]: hex } });

    const colors = value[mode];

    return (
        <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
            <div className="flex flex-col gap-8">
                {/* Presets */}
                <section className="flex flex-col gap-3">
                    <SectionHeading
                        title="Starter themes"
                        hint="Apply one, then fine-tune below."
                    />
                    <div className="flex flex-wrap gap-2">
                        {THEME_PRESETS.map((preset) => (
                            <button
                                key={preset.name}
                                type="button"
                                onClick={() => applyPreset(preset.config)}
                                title={preset.description}
                                className="group flex items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors hover:border-primary/40 hover:bg-accent/40"
                            >
                                <span className="flex -space-x-1">
                                    <Swatch hex={preset.config.light.primary} />
                                    <Swatch hex={preset.config.light.secondary} />
                                    <Swatch hex={preset.config.light.accent} />
                                </span>
                                <span className="font-medium">{preset.name}</span>
                            </button>
                        ))}
                    </div>
                </section>

                {/* Fonts */}
                <section className="flex flex-col gap-3">
                    <SectionHeading
                        title="Typography"
                        hint="Headings and body text on your public site."
                    />
                    <div className="grid gap-4 sm:grid-cols-2">
                        <FontSelect
                            id="heading-font"
                            label="Heading font"
                            value={value.fonts.heading}
                            onChange={(k) => setFont("heading", k)}
                        />
                        <FontSelect
                            id="body-font"
                            label="Body font"
                            value={value.fonts.body}
                            onChange={(k) => setFont("body", k)}
                        />
                    </div>
                </section>

                {/* Radius */}
                <section className="flex flex-col gap-3">
                    <SectionHeading
                        title="Corner radius"
                        hint={`${value.radius.toFixed(3).replace(/0+$/, "").replace(/\.$/, "")}rem`}
                    />
                    <input
                        type="range"
                        min={0}
                        max={1.5}
                        step={0.025}
                        value={value.radius}
                        onChange={(e) =>
                            onChange({ ...value, radius: Number(e.target.value) })
                        }
                        aria-label="Corner radius"
                        className="w-full accent-primary"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Square</span>
                        <span>Rounded</span>
                    </div>
                </section>

                {/* Colors */}
                <section className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <SectionHeading title="Colors" />
                        <ModeSwitch mode={mode} onChange={setMode} />
                    </div>
                    <div className="flex flex-col gap-3">
                        {COLOR_KEYS.map(({ key, label }) => (
                            <ColorField
                                key={key}
                                label={label}
                                value={colors[key]}
                                onChange={(hex) => setColor(key, hex)}
                            />
                        ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Text colors are picked automatically for readable
                        contrast.
                    </p>
                </section>
            </div>

            {/* Live preview */}
            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-muted-foreground">
                        Live preview
                    </p>
                    <ModeSwitch
                        mode={previewDark ? "dark" : "light"}
                        onChange={(m) => setPreviewDark(m === "dark")}
                    />
                </div>
                <ThemePreview theme={value} dark={previewDark} />
            </div>
        </div>
    );
}

// ── Live preview ─────────────────────────────────────────────────────────────

function ThemePreview({ theme, dark }: { theme: ThemeConfig; dark: boolean }) {
    const scope = "[data-brand-preview]";
    return (
        <div className="overflow-hidden rounded-xl border">
            <style
                dangerouslySetInnerHTML={{ __html: themeToCss(theme, scope) }}
            />
            <div
                data-brand-preview
                className={cn(
                    "bg-background text-foreground",
                    dark && "dark",
                )}
            >
                {/* Nav */}
                <div className="flex items-center justify-between bg-primary px-4 py-3 text-primary-foreground">
                    <span className="font-heading text-sm font-semibold">
                        Your Site
                    </span>
                    <span className="text-xs opacity-80">Communities</span>
                </div>
                {/* Body */}
                <div className="flex flex-col gap-4 p-4">
                    <div className="flex flex-col gap-1">
                        <h3 className="font-heading text-lg font-semibold leading-tight">
                            Find your next home
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            New construction across Southeast Florida, in your
                            brand.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            className="rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
                        >
                            Schedule a visit
                        </button>
                        <button
                            type="button"
                            className="rounded-md bg-secondary px-3 py-2 text-xs font-semibold text-secondary-foreground"
                        >
                            Browse plans
                        </button>
                    </div>
                    <div className="rounded-lg border bg-card p-3 text-card-foreground">
                        <div className="flex items-center gap-2">
                            <span className="rounded-md bg-accent px-2 py-1 text-xs font-medium text-accent-foreground">
                                New
                            </span>
                            <span className="text-sm font-medium">
                                Coral Bay · from $480k
                            </span>
                        </div>
                        <div className="mt-2 h-1.5 w-2/3 rounded-full bg-primary" />
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Small building blocks ────────────────────────────────────────────────────

function SectionHeading({ title, hint }: { title: string; hint?: string }) {
    return (
        <div className="flex items-baseline justify-between gap-2">
            <h4 className="text-sm font-semibold">{title}</h4>
            {hint && (
                <span className="text-xs text-muted-foreground">{hint}</span>
            )}
        </div>
    );
}

function Swatch({ hex }: { hex: string }) {
    return (
        <span
            className="size-4 rounded-full ring-1 ring-black/10"
            style={{ backgroundColor: HEX.test(hex) ? hex : "transparent" }}
        />
    );
}

function ModeSwitch({
    mode,
    onChange,
}: {
    mode: "light" | "dark";
    onChange: (m: "light" | "dark") => void;
}) {
    return (
        <div className="inline-flex rounded-md border p-0.5 text-xs">
            <button
                type="button"
                onClick={() => onChange("light")}
                className={cn(
                    "flex items-center gap-1 rounded px-2 py-1 transition-colors",
                    mode === "light"
                        ? "bg-secondary text-secondary-foreground"
                        : "text-muted-foreground",
                )}
            >
                <Sun className="size-3.5" /> Light
            </button>
            <button
                type="button"
                onClick={() => onChange("dark")}
                className={cn(
                    "flex items-center gap-1 rounded px-2 py-1 transition-colors",
                    mode === "dark"
                        ? "bg-secondary text-secondary-foreground"
                        : "text-muted-foreground",
                )}
            >
                <Moon className="size-3.5" /> Dark
            </button>
        </div>
    );
}

function ColorField({
    label,
    value,
    onChange,
}: {
    label: string;
    value: string;
    onChange: (hex: string) => void;
}) {
    const valid = HEX.test(value);
    return (
        <div className="flex items-end gap-3">
            <input
                type="color"
                aria-label={`${label} color`}
                value={valid ? value : "#000000"}
                onChange={(e) => onChange(e.target.value)}
                className="size-9 shrink-0 cursor-pointer rounded-md border bg-transparent p-1"
            />
            <div className="flex flex-1 flex-col gap-1">
                <Label className="text-xs text-muted-foreground">{label}</Label>
                <Input
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    aria-invalid={!valid || undefined}
                    className="h-8 font-mono"
                    placeholder="#1d4ed8"
                />
            </div>
        </div>
    );
}

function FontSelect({
    id,
    label,
    value,
    onChange,
}: {
    id: string;
    label: string;
    value: string;
    onChange: (key: string) => void;
}) {
    const selected = FONT_BY_KEY[value];
    return (
        <div className="flex flex-col gap-1.5">
            <Label htmlFor={id} className="text-xs text-muted-foreground">
                {label}
            </Label>
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger id={id} className="w-full">
                    <SelectValue
                        placeholder="Choose a font"
                        style={
                            selected
                                ? { fontFamily: `var(${selected.cssVar})` }
                                : undefined
                        }
                    />
                </SelectTrigger>
                <SelectContent>
                    {(
                        Object.keys(FONTS_BY_CATEGORY) as FontCategory[]
                    ).map((category) => (
                        <SelectGroup key={category}>
                            <SelectLabel>{CATEGORY_LABEL[category]}</SelectLabel>
                            {FONTS_BY_CATEGORY[category].map((font) => (
                                <SelectItem key={font.key} value={font.key}>
                                    <span
                                        style={{
                                            fontFamily: `var(${font.cssVar})`,
                                        }}
                                    >
                                        {font.label}
                                    </span>
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
