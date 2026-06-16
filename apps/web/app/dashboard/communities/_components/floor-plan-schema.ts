import { z } from "zod";

// Standalone floor-plan form schema (lifted out of the old combined community
// form). Numeric fields use `string -> number` transforms so inputs stay text.

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

export const mediaSchema = z.object({
    // Uploaded gallery image URL. Video for the plan lives in `modelVideo`.
    src: z.string().min(1, "Source is required"),
    alt: z.string().min(1, "Alt text is required"),
    caption: z.string().optional(),
});

export const floorPlanSchema = z.object({
    slug: z
        .string()
        .min(1, "Slug is required")
        .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, and dashes only"),
    name: z.string().min(1, "Name is required"),
    brand: z.string().optional(),
    startingPrice: intField("Starting price is required"),
    beds: intField("Beds is required"),
    baths: decimalField("Baths is required"),
    garage: intField("Garage is required"),
    stories: intField("Stories is required"),
    sqft: intField("Square footage is required"),
    image: z.string().min(1, "Hero image is required"),
    modelVideo: z
        .union([z.string().url("Must be a valid URL"), z.literal("")])
        .optional(),
    description: z.string().optional(),
    diagramImage: z.string().optional(),
    gallery: z.array(mediaSchema),
});

export type FloorPlanFormValues = z.input<typeof floorPlanSchema>;
export type FloorPlanFormOutput = z.output<typeof floorPlanSchema>;
