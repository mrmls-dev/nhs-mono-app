import { z } from "zod";

// Mirrors the Prisma `Community` model + its School relation and amenity tags.
// Floor plans are managed separately (see the floor-plan form), not here.
//
// Numeric fields are modelled as `string -> number` transforms so the form's
// INPUT type is `string` (ideal for text inputs and default values) while the
// validated OUTPUT type is `number`. Numeric ranges are split into min/max,
// matching the schema (single values just set min = max).

const COMMUNITY_STATUSES = ["NOW_SELLING", "COMING_SOON", "SOLD_OUT"] as const;

// `string -> number` helpers.
const intField = (msg = "Required") =>
    z
        .string()
        .min(1, msg)
        .regex(/^\d+$/, "Must be a whole number")
        .transform(Number);

const decimalField = (msg = "Required") =>
    z
        .string()
        .min(1, msg)
        .regex(/^\d+(\.\d+)?$/, "Must be a number")
        .transform(Number);

const signedDecimalField = (msg = "Required") =>
    z
        .string()
        .min(1, msg)
        .regex(/^-?\d+(\.\d+)?$/, "Must be a number")
        .transform(Number);

export const schoolSchema = z.object({
    name: z.string().min(1, "School name is required"),
    type: z.string().min(1, "Type is required"),
    grades: z.string().min(1, "Grades are required"),
    distance: z.string().min(1, "Distance is required"),
});

export const communitySchema = z
    .object({
        // Identity
        slug: z
            .string()
            .min(1, "Slug is required")
            .regex(
                /^[a-z0-9-]+$/,
                "Lowercase letters, numbers, and dashes only",
            ),
        name: z.string().min(1, "Name is required"),
        brand: z.string().optional(),
        location: z.string().min(1, "Location is required"),
        image: z.string().min(1, "Hero image is required"),
        status: z.enum(COMMUNITY_STATUSES),
        homesForSale: intField("Homes for sale is required"),

        // Ranges
        bedsMin: intField("Min beds is required"),
        bedsMax: intField("Max beds is required"),
        bathsMin: decimalField("Min baths is required"),
        bathsMax: decimalField("Max baths is required"),
        garageMin: intField("Min garage is required"),
        garageMax: intField("Max garage is required"),
        storiesMin: intField("Min stories is required"),
        storiesMax: intField("Max stories is required"),

        // Pricing / size
        sqftFrom: intField("Square footage is required"),
        priceFrom: intField("Starting price is required"),

        // Map
        lat: signedDecimalField("Latitude is required"),
        lng: signedDecimalField("Longitude is required"),

        about: z.string().min(1, "About is required"),

        // Relations
        countyId: z.string().min(1, "Select a county"),
        amenities: z.array(z.string().min(1)),
        schools: z.array(schoolSchema),
    })
    .superRefine((val, ctx) => {
        const ranges: [number, number, string][] = [
            [val.bedsMin, val.bedsMax, "bedsMax"],
            [val.bathsMin, val.bathsMax, "bathsMax"],
            [val.garageMin, val.garageMax, "garageMax"],
            [val.storiesMin, val.storiesMax, "storiesMax"],
        ];
        for (const [min, max, path] of ranges) {
            if (max < min) {
                ctx.addIssue({
                    code: "custom",
                    message: "Max cannot be less than min",
                    path: [path],
                });
            }
        }
    });

export type CommunityFormValues = z.input<typeof communitySchema>;
export type CommunityFormOutput = z.output<typeof communitySchema>;

export { COMMUNITY_STATUSES };
