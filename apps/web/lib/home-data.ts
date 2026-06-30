/**
 * Static content + light helpers for the buyer-focused marketing home page
 * (`app/(marketing)/page.tsx`). Survey option lists, value props, savings data,
 * dummy featured-community + blog data, FAQ copy, plus the tiny DOM-event bus
 * that lets any CTA open the `BuyerMatchSurvey` at a given step without a shared
 * React context.
 */

import {
    Thermometer,
    Zap,
    Smartphone,
    Sun,
    AppWindow,
    Snowflake,
    type LucideIcon,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Survey ↔ CTA event bus
// ---------------------------------------------------------------------------

export const BUYER_MATCH_EVENT = "buyer-match:open";

/** Sticky-nav height (`h-21.25` = 85px) used as the scroll offset. */
export const HEADER_OFFSET = 85;

export type BuyerMatchOpenDetail = { step: number };

/** Fire from any CTA to scroll the survey into view and jump to `step`. */
export function openBuyerMatch(step = 1): void {
    if (typeof window === "undefined") return;
    window.dispatchEvent(
        new CustomEvent<BuyerMatchOpenDetail>(BUYER_MATCH_EVENT, {
            detail: { step },
        }),
    );
}

// ---------------------------------------------------------------------------
// Survey options
// ---------------------------------------------------------------------------

/** Step 0 quick picks — bedrooms are captured here, not on a separate step. */
export const QUICK_BEDROOMS = ["2", "3", "4+"] as const;
export const BATHROOM_OPTIONS = ["1", "2", "3", "4"] as const;

/** SE Florida counties — fallback labels when the live county list is empty. */
export const COUNTY_OPTIONS = [
    "Broward",
    "Martin",
    "Miami-Dade",
    "Palm Beach",
] as const;

/** A selectable location, optionally carrying the real county id for filtering. */
export type CountyOption = { id: string | null; name: string };

/** Budget band → max price used to filter the listing (null = no ceiling). */
export const BUDGET_PRICE_MAX: Record<string, number | null> = {
    "Under $400k": 400000,
    "$400k – $450k": 450000,
    "$450k – $500k": 500000,
    "$500k+": null,
};

export type HomeTypeOption = {
    value: string;
    label: string;
    description: string;
};

export const HOME_TYPE_OPTIONS: HomeTypeOption[] = [
    {
        value: "single-family",
        label: "Single-family",
        description: "A standalone home with its own yard and garage.",
    },
    {
        value: "townhome",
        label: "Townhome",
        description: "Multi-level living with shared walls and low upkeep.",
    },
];

/** Lowest featured price is $367,990, so the lowest band is "Under $400k". */
export const BUDGET_OPTIONS = [
    "Under $400k",
    "$400k – $450k",
    "$450k – $500k",
    "$500k+",
] as const;

// ---------------------------------------------------------------------------
// Lead payload (assembled at submit — ready to POST to GHL later)
// ---------------------------------------------------------------------------

export type BuyerMatchAnswers = {
    location: string;
    homeType: string | null;
    bedrooms: string | null;
    bathrooms: string | null;
    budget: string | null;
};

export type LeadPayload = BuyerMatchAnswers & {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    consent: boolean;
    countyId: string | null;
    matchCount: number;
};

/** SMS/marketing consent disclosure shown above the (optional) consent box. */
export const CONSENT_TEXT =
    "By selecting “I consent” below, you consent to receive marketing SMS communications and other communications (via mail, email, or telephone) from us, our affiliates, and our partner builders and lenders. Calls and text messages may be sent via autodialer and use an artificial or prerecorded voice. Consent is not required to purchase a home. Message and data rates may apply. Message frequency may vary. Text HELP for help. Text STOP to unsubscribe — you may unsubscribe at any time and no further messages will be sent. By clicking “Show my matches” you agree to our Privacy Policy and Terms & Conditions.";

// ---------------------------------------------------------------------------
// Hero bullets — the strongest value points, pulled from VALUE_PROPS
// ---------------------------------------------------------------------------

export const HERO_BULLETS = [
    "10-year structural warranty",
    "$210–$360 built-in monthly savings",
    "No bidding wars — set prices",
];

// ---------------------------------------------------------------------------
// Trust stats bar
// ---------------------------------------------------------------------------

export type TrustStat = { value: string; label: string };

export const TRUST_STATS: TrustStat[] = [
    { value: "4", label: "Counties served" },
    { value: "30+", label: "Active communities" },
    { value: "$210–$360", label: "Monthly savings built-in" },
    { value: "10-Year", label: "Structural warranty" },
];

// ---------------------------------------------------------------------------
// "Why new construction" value props
// ---------------------------------------------------------------------------

export type ValueProp = { no: string; title: string; body: string };

export const VALUE_PROPS: ValueProp[] = [
    {
        no: "01",
        title: "Brand new",
        body: "Never-lived-in homes with modern layouts, new appliances, and warranties — no deferred maintenance to inherit.",
    },
    {
        no: "02",
        title: "Customize",
        body: "Choose finishes, upgrades, and floor plans that fit how you actually live, instead of settling for someone else's choices.",
    },
    {
        no: "03",
        title: "Builder incentives",
        body: "Rate buy-downs, closing-cost credits, and design-center allowances that resale homes simply can't offer.",
    },
    {
        no: "04",
        title: "Builder warranty",
        body: "Every home is backed by a structural warranty. You're covered — not gambling on what the previous owner left behind.",
    },
    {
        no: "05",
        title: "Built-in monthly savings",
        body: "Modern insulation, Energy Star appliances, and smart-home features cut utility bills by $210–$360/month — automatically.",
    },
    {
        no: "06",
        title: "No bidding wars",
        body: "Set prices. No competing offers, no waiving inspections, no emotional auction — just a straightforward path to your home.",
    },
    {
        no: "07",
        title: "Exclusive financing",
        body: "In-house lenders offer rates and programs unavailable on the open market, so your buying power goes further.",
    },
];

// ---------------------------------------------------------------------------
// Built-in monthly savings breakdown
// ---------------------------------------------------------------------------

export const SAVINGS_TOTAL = "$210–$360";

export type SavingsItem = { icon: LucideIcon; title: string; amount: string };

export const SAVINGS_ITEMS: SavingsItem[] = [
    { icon: Thermometer, title: "Modern insulation", amount: "$40–$80" },
    { icon: Zap, title: "Energy Star appliances", amount: "$30–$60" },
    { icon: Smartphone, title: "Smart-home features", amount: "$20–$40" },
    { icon: Sun, title: "Solar-ready design", amount: "$50–$100" },
    { icon: AppWindow, title: "Low-E windows", amount: "$30–$50" },
    { icon: Snowflake, title: "High-efficiency HVAC", amount: "$30–$60" },
];

// ---------------------------------------------------------------------------
// How it works (infographic)
// ---------------------------------------------------------------------------

export type HowItWorksStep = { no: string; title: string; body: string };

export const HOW_IT_WORKS: HowItWorksStep[] = [
    {
        no: "1",
        title: "Share your must-haves",
        body: "Tell us your county, budget, and the features that matter most to you.",
    },
    {
        no: "2",
        title: "Get your matched list",
        body: "We hand-pick brand-new homes and current builder incentives — with real pricing.",
    },
    {
        no: "3",
        title: "Tour with a specialist",
        body: "A local new-construction specialist lines up tours and handles the builder paperwork.",
    },
];

// ---------------------------------------------------------------------------
// FAQ
// ---------------------------------------------------------------------------

export type FaqItem = { question: string; answer: string };

export const FAQ_ITEMS: FaqItem[] = [
    {
        question: "What is new construction?",
        answer: "New-construction homes are newly built by a homebuilder and have never been lived in. You can often buy while they're being built — or before — and move into a home that's completely brand new.",
    },
    {
        question: "How is it different from resale?",
        answer: "Resale homes are previously owned. New construction means modern floor plans, new materials and systems, builder warranties, and the chance to personalize finishes — with no prior wear and tear.",
    },
    {
        question: "Can I customize the home?",
        answer: "In most communities, yes. Depending on how early you buy, you can select your floor plan, structural options, and design-center finishes like cabinets, flooring, and countertops.",
    },
    {
        question: "Is it more expensive than resale?",
        answer: "Not necessarily. Builder incentives — rate buy-downs, closing-cost credits, and included upgrades — plus $210–$360/month in built-in energy savings often make a brand-new home the better value.",
    },
    {
        question: "How long does it take to build?",
        answer: "It depends on the stage. Move-in-ready (inventory) homes can close in weeks, while a to-be-built home typically takes a few months. We'll show you options that fit your timeline.",
    },
    {
        question: "Do I still need my own agent?",
        answer: "Yes — and it costs you nothing. The builder pays the commission, and having a specialist on your side means someone is protecting your interests through pricing, incentives, and paperwork.",
    },
];

// ---------------------------------------------------------------------------
// Recent news / blog (placeholder)
// ---------------------------------------------------------------------------

export type BlogPost = {
    id: string;
    title: string;
    excerpt: string;
    category: string;
    date: string;
    readTime: string;
};

export const BLOG_POSTS: BlogPost[] = [
    {
        id: "builder-incentives-2026",
        title: "5 builder incentives that can save you thousands in 2026",
        excerpt: "Rate buy-downs and closing-cost credits are back. Here's how to stack them and what to ask for before you sign.",
        category: "Buying tips",
        date: "Jun 12, 2026",
        readTime: "4 min read",
    },
    {
        id: "new-vs-resale-cost",
        title: "New construction vs. resale: the real cost breakdown",
        excerpt: "Sticker price isn't the whole story. We compare warranties, energy bills, and maintenance over the first five years.",
        category: "Market insights",
        date: "Jun 3, 2026",
        readTime: "6 min read",
    },
    {
        id: "in-house-lender-rate",
        title: "How to lock a lower rate with a builder's in-house lender",
        excerpt: "Builder lenders can offer programs the open market can't. Here's when it pays to use them — and when it doesn't.",
        category: "Financing",
        date: "May 22, 2026",
        readTime: "5 min read",
    },
];
