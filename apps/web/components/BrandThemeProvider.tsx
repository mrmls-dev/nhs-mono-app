import { themeToCss, type ThemeConfig } from "@/lib/theme";

/**
 * Applies a tenant's {@link ThemeConfig} to the public marketing site. Emits a
 * scoped `<style>` block (colors + radius + fonts, with a `.dark` variant) and
 * wraps children in the `[data-brand]` element those rules target, so shadcn's
 * semantic tokens (`--primary`, `--secondary`, `--accent`, `--radius`,
 * `--font-sans`…) pick up the brand without touching the global tokens in
 * `packages/ui/src/styles/globals.css`.
 *
 * The tenant is resolved by Host header in the marketing layout.
 */
export function BrandThemeProvider({
    theme,
    children,
}: {
    theme: ThemeConfig;
    children: React.ReactNode;
}) {
    return (
        <>
            <style
                // Generated from a trusted, validated theme (hex colors, numeric
                // radius, allowlisted font keys) — no user free-text reaches CSS.
                dangerouslySetInnerHTML={{ __html: themeToCss(theme) }}
            />
            <div data-brand className="contents">
                {children}
            </div>
        </>
    );
}
