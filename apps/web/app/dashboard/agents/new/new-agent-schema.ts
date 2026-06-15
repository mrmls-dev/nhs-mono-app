import { z } from "zod";

export const US_STATES = [
    ["AL", "Alabama"], ["AK", "Alaska"], ["AZ", "Arizona"], ["AR", "Arkansas"],
    ["CA", "California"], ["CO", "Colorado"], ["CT", "Connecticut"], ["DE", "Delaware"],
    ["FL", "Florida"], ["GA", "Georgia"], ["HI", "Hawaii"], ["ID", "Idaho"],
    ["IL", "Illinois"], ["IN", "Indiana"], ["IA", "Iowa"], ["KS", "Kansas"],
    ["KY", "Kentucky"], ["LA", "Louisiana"], ["ME", "Maine"], ["MD", "Maryland"],
    ["MA", "Massachusetts"], ["MI", "Michigan"], ["MN", "Minnesota"], ["MS", "Mississippi"],
    ["MO", "Missouri"], ["MT", "Montana"], ["NE", "Nebraska"], ["NV", "Nevada"],
    ["NH", "New Hampshire"], ["NJ", "New Jersey"], ["NM", "New Mexico"], ["NY", "New York"],
    ["NC", "North Carolina"], ["ND", "North Dakota"], ["OH", "Ohio"], ["OK", "Oklahoma"],
    ["OR", "Oregon"], ["PA", "Pennsylvania"], ["RI", "Rhode Island"], ["SC", "South Carolina"],
    ["SD", "South Dakota"], ["TN", "Tennessee"], ["TX", "Texas"], ["UT", "Utah"],
    ["VT", "Vermont"], ["VA", "Virginia"], ["WA", "Washington"], ["WV", "West Virginia"],
    ["WI", "Wisconsin"], ["WY", "Wyoming"],
] as const;

/** GHL uses a "US/Region" timezone format, not IANA. */
export const GHL_TIMEZONES = [
    { label: "Eastern (ET)", value: "US/Eastern" },
    { label: "Central (CT)", value: "US/Central" },
    { label: "Mountain (MT)", value: "US/Mountain" },
    { label: "Pacific (PT)", value: "US/Pacific" },
    { label: "Alaska (AKT)", value: "US/Alaska" },
    { label: "Hawaii (HT)", value: "US/Hawaii" },
    { label: "Atlantic (AT)", value: "US/Atlantic" },
    { label: "UTC", value: "UTC" },
] as const;

export const BUSINESS_TYPES = [
    "Real Estate",
    "Mortgage",
    "Property Management",
    "Real Estate Investment",
    "Contractor",
    "Other",
] as const;

const toSlug = (v: string) =>
    v.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

export const newAgentSchema = z.object({
    // ── Owner ────────────────────────────────────────────────────────────────
    ownerFirstName: z.string().min(1, "First name is required"),
    ownerLastName: z.string().min(1, "Last name is required"),
    ownerEmail: z.string().min(1, "Email is required").email("Enter a valid email"),
    password: z.string().min(8, "Use at least 8 characters").max(72, "Too long"),

    // ── Organization ─────────────────────────────────────────────────────────
    name: z.string().min(1, "Company name is required"),
    slug: z
        .string()
        .min(1, "Slug is required")
        .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, and dashes only"),
    businessType: z.string().optional(),
    website: z
        .string()
        .optional()
        .refine(
            (v) => !v || /^https?:\/\/.+/.test(v),
            "Enter a full URL, e.g. https://example.com",
        ),

    // ── Business contact (GHL prospectInfo) ──────────────────────────────────
    businessEmail: z.string().email("Enter a valid email").optional().or(z.literal("")),
    contactPhone: z
        .string()
        .optional()
        .refine(
            (v) => !v || /^\+?[\d\s\-().]{7,}$/.test(v),
            "Enter a valid phone number",
        ),

    // ── Address ───────────────────────────────────────────────────────────────
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().optional(),
    timezone: z.string().optional(),

    // ── GHL settings ─────────────────────────────────────────────────────────
    ghlAllowDuplicateContact: z.boolean().optional(),
    ghlAllowDuplicateOpportunity: z.boolean().optional(),
    ghlAllowFacebookNameMerge: z.boolean().optional(),
    ghlDisableContactTimezone: z.boolean().optional(),
});

export type NewAgentValues = z.infer<typeof newAgentSchema>;

export { toSlug };
