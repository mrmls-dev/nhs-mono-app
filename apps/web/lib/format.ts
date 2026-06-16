// Shown for a community's derived specs (beds/baths/garage/stories/sqft/price)
// before any floor plan exists — at which point every aggregate is 0.
export const SPEC_PLACEHOLDER = "—";

export function formatRange(min: number, max: number, unit: string): string {
    const lo = min === max ? `${min}` : `${min}-${max}`;
    return `${lo} ${unit}${max !== 1 ? "s" : ""}`;
}

export function formatStories(min: number, max: number): string {
    if (min === max) return `${min} ${min === 1 ? "Story" : "Stories"}`;
    return `${min}-${max} Stories`;
}

export function formatGarage(min: number, max: number): string {
    return min === max ? `${min} Car Garage` : `${min}-${max} Car Garage`;
}

export function formatPrice(n: number): string {
    return n.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
    });
}

export function formatStat(value: number, unit: string): string {
    return `${value} ${unit}${value !== 1 ? "s" : ""}`;
}

export const STATUS_LABELS: Record<string, string> = {
    NOW_SELLING: "Now Selling",
    COMING_SOON: "Coming Soon",
    SOLD_OUT: "Sold Out",
};
