"use client";

import { useEffect, useState } from "react";
import {
    useForm,
    FormProvider,
    Controller,
    useWatch,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@workspace/ui/components/button";
import {
    Field,
    FieldDescription,
    FieldError,
    FieldGroup,
    FieldLabel,
} from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import { Textarea } from "@workspace/ui/components/textarea";
import { Separator } from "@workspace/ui/components/separator";
import { ImagePicker } from "@/components/ImagePicker";
import {
    floorPlanSchema,
    type FloorPlanFormValues,
    type FloorPlanFormOutput,
} from "./floor-plan-schema";
import { MediaFieldArray } from "./MediaFieldArray";
import { ImageSelector } from "./ImageSelector";

const toSlug = (v: string) =>
    v
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");

const emptyValues: FloorPlanFormValues = {
    slug: "",
    name: "",
    brand: "",
    startingPrice: "",
    beds: "",
    baths: "",
    garage: "",
    stories: "",
    sqft: "",
    image: "",
    modelVideo: "",
    description: "",
    diagramImage: "",
    gallery: [],
};

export function FloorPlanForm({
    communitySlug,
    defaultValues,
    submitLabel = "Save floor plan",
    onSubmit,
}: {
    communitySlug: string;
    defaultValues?: Partial<FloorPlanFormValues>;
    submitLabel?: string;
    onSubmit: (values: FloorPlanFormOutput) => Promise<void> | void;
}) {
    const form = useForm<FloorPlanFormValues, unknown, FloorPlanFormOutput>({
        resolver: zodResolver(floorPlanSchema),
        defaultValues: { ...emptyValues, ...defaultValues },
        mode: "onBlur",
    });

    const {
        register,
        control,
        handleSubmit,
        setValue,
        formState: { errors, isSubmitting },
    } = form;

    const planSlug = useWatch({ control, name: "slug" });
    const planName = useWatch({ control, name: "name" });
    const baseFolder = `communities/${communitySlug}/${planSlug || "new"}`;

    // Auto-fill the slug from the name while creating, until the user edits the
    // slug themselves. In edit mode the slug already exists, so leave it alone.
    const [slugDirty, setSlugDirty] = useState(Boolean(defaultValues?.slug));
    useEffect(() => {
        if (!slugDirty) {
            setValue("slug", toSlug(planName ?? ""), { shouldValidate: false });
        }
    }, [planName, slugDirty, setValue]);

    const gallery = useWatch({ control, name: "gallery" });
    const galleryImages = (gallery ?? [])
        .filter((m) => m.src?.startsWith("http"))
        .map((m) => m.src);

    const submit = async (values: FloorPlanFormOutput) => {
        try {
            await onSubmit(values);
        } catch (err: unknown) {
            toast.error(
                err instanceof Error ? err.message : "Something went wrong",
            );
        }
    };

    const onError = () => toast.error("Please fix the highlighted fields.");

    return (
        <FormProvider {...form}>
            <form
                onSubmit={handleSubmit(submit, onError)}
                className="flex flex-col gap-6"
                noValidate
            >
                <FieldGroup className="gap-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                        <Field data-invalid={errors.name ? true : undefined}>
                            <FieldLabel>Name</FieldLabel>
                            <Input
                                placeholder="Bella"
                                aria-invalid={errors.name ? true : undefined}
                                {...register("name")}
                            />
                            {errors.name && (
                                <FieldError
                                    errors={[{ message: errors.name.message }]}
                                />
                            )}
                        </Field>
                        <Field data-invalid={errors.slug ? true : undefined}>
                            <FieldLabel>Slug</FieldLabel>
                            <Input
                                placeholder="bella"
                                aria-invalid={errors.slug ? true : undefined}
                                {...register("slug", {
                                    onChange: () => setSlugDirty(true),
                                })}
                            />
                            {errors.slug && (
                                <FieldError
                                    errors={[{ message: errors.slug.message }]}
                                />
                            )}
                        </Field>
                    </div>

                    <Field>
                        <FieldLabel>Brand (optional)</FieldLabel>
                        <Input
                            placeholder="Tradition Series℠"
                            {...register("brand")}
                        />
                    </Field>

                    <div className="grid gap-3 sm:grid-cols-3">
                        <Field
                            data-invalid={
                                errors.startingPrice ? true : undefined
                            }
                        >
                            <FieldLabel>Starting price ($)</FieldLabel>
                            <Input
                                inputMode="numeric"
                                placeholder="484990"
                                aria-invalid={
                                    errors.startingPrice ? true : undefined
                                }
                                {...register("startingPrice")}
                            />
                            {errors.startingPrice && (
                                <FieldError
                                    errors={[
                                        {
                                            message:
                                                errors.startingPrice.message,
                                        },
                                    ]}
                                />
                            )}
                        </Field>
                        <Field data-invalid={errors.sqft ? true : undefined}>
                            <FieldLabel>Sq. ft.</FieldLabel>
                            <Input
                                inputMode="numeric"
                                placeholder="1446"
                                aria-invalid={errors.sqft ? true : undefined}
                                {...register("sqft")}
                            />
                            {errors.sqft && (
                                <FieldError
                                    errors={[{ message: errors.sqft.message }]}
                                />
                            )}
                        </Field>
                        <Field data-invalid={errors.stories ? true : undefined}>
                            <FieldLabel>Stories</FieldLabel>
                            <Input
                                inputMode="numeric"
                                placeholder="2"
                                aria-invalid={errors.stories ? true : undefined}
                                {...register("stories")}
                            />
                            {errors.stories && (
                                <FieldError
                                    errors={[
                                        { message: errors.stories.message },
                                    ]}
                                />
                            )}
                        </Field>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                        <Field data-invalid={errors.beds ? true : undefined}>
                            <FieldLabel>Beds</FieldLabel>
                            <Input
                                inputMode="numeric"
                                placeholder="3"
                                aria-invalid={errors.beds ? true : undefined}
                                {...register("beds")}
                            />
                            {errors.beds && (
                                <FieldError
                                    errors={[{ message: errors.beds.message }]}
                                />
                            )}
                        </Field>
                        <Field data-invalid={errors.baths ? true : undefined}>
                            <FieldLabel>Baths</FieldLabel>
                            <Input
                                inputMode="decimal"
                                placeholder="2.5"
                                aria-invalid={errors.baths ? true : undefined}
                                {...register("baths")}
                            />
                            {errors.baths && (
                                <FieldError
                                    errors={[{ message: errors.baths.message }]}
                                />
                            )}
                        </Field>
                        <Field data-invalid={errors.garage ? true : undefined}>
                            <FieldLabel>Garage</FieldLabel>
                            <Input
                                inputMode="numeric"
                                placeholder="2"
                                aria-invalid={errors.garage ? true : undefined}
                                {...register("garage")}
                            />
                            {errors.garage && (
                                <FieldError
                                    errors={[
                                        { message: errors.garage.message },
                                    ]}
                                />
                            )}
                        </Field>
                    </div>

                    <Field
                        data-invalid={errors.modelVideo ? true : undefined}
                    >
                        <FieldLabel>Model video URL (optional)</FieldLabel>
                        <Input
                            placeholder="https://youtu.be/..."
                            aria-invalid={errors.modelVideo ? true : undefined}
                            {...register("modelVideo")}
                        />
                        {errors.modelVideo && (
                            <FieldError
                                errors={[
                                    { message: errors.modelVideo.message },
                                ]}
                            />
                        )}
                    </Field>

                    <Field>
                        <FieldLabel>Description (optional)</FieldLabel>
                        <Textarea
                            rows={4}
                            placeholder="Describe this floor plan..."
                            {...register("description")}
                        />
                    </Field>

                    <Field>
                        <FieldLabel>Diagram image (optional)</FieldLabel>
                        <FieldDescription>
                            Floor plan diagram or layout image.
                        </FieldDescription>
                        <Controller
                            control={control}
                            name="diagramImage"
                            render={({ field }) => (
                                <ImagePicker
                                    value={field.value}
                                    onChange={field.onChange}
                                    onBlur={field.onBlur}
                                    folder={`${baseFolder}/diagrams`}
                                />
                            )}
                        />
                    </Field>

                    <Separator />

                    <div className="flex flex-col gap-2">
                        <FieldLabel>Gallery</FieldLabel>
                        <FieldDescription>
                            Upload images for this floor plan.
                        </FieldDescription>
                        <MediaFieldArray
                            name="gallery"
                            folder={`${baseFolder}/gallery`}
                        />
                    </div>

                    <Field data-invalid={errors.image ? true : undefined}>
                        <FieldLabel>Hero image</FieldLabel>
                        <FieldDescription>
                            Select one image from the gallery above as the
                            thumbnail.
                        </FieldDescription>
                        <Controller
                            control={control}
                            name="image"
                            render={({ field }) => (
                                <ImageSelector
                                    images={galleryImages}
                                    value={field.value}
                                    onChange={field.onChange}
                                    invalid={Boolean(errors.image)}
                                    emptyText="Upload gallery images first"
                                />
                            )}
                        />
                        {errors.image && (
                            <FieldError
                                errors={[{ message: errors.image.message }]}
                            />
                        )}
                    </Field>
                </FieldGroup>

                <div className="flex items-center justify-end gap-3">
                    <Button type="submit" disabled={isSubmitting}>
                        <Save data-icon="inline-start" />
                        {submitLabel}
                    </Button>
                </div>
            </form>
        </FormProvider>
    );
}
