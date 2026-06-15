"use client";

import {
    Controller,
    useFieldArray,
    useFormContext,
    useWatch,
} from "react-hook-form";
import { Plus, Trash2, LayoutTemplate } from "lucide-react";
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
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "@workspace/ui/components/empty";
import type { CommunityFormValues } from "../community-schema";
import { MediaFieldArray } from "./MediaFieldArray";
import { ImageSelector } from "./ImageSelector";
import { ImagePicker } from "@/components/ImagePicker";

export function FloorPlanFieldArray() {
    const { control } = useFormContext<CommunityFormValues>();

    const communitySlug = useWatch({ control, name: "slug" });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "floorPlans",
    });

    return (
        <div className="flex flex-col gap-4">
            {fields.length === 0 ? (
                <Empty className="border border-dashed">
                    <EmptyHeader>
                        <EmptyMedia variant="icon">
                            <LayoutTemplate />
                        </EmptyMedia>
                        <EmptyTitle>No floor plans yet</EmptyTitle>
                        <EmptyDescription>
                            Add the floor plans available in this community.
                        </EmptyDescription>
                    </EmptyHeader>
                </Empty>
            ) : (
                fields.map((field, index) => (
                    <FloorPlanRow
                        key={field.id}
                        index={index}
                        communitySlug={communitySlug}
                        onRemove={() => remove(index)}
                    />
                ))
            )}

            <div>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                        append({
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
                        })
                    }
                >
                    <Plus data-icon="inline-start" />
                    Add floor plan
                </Button>
            </div>
        </div>
    );
}

function FloorPlanRow({
    index,
    communitySlug,
    onRemove,
}: {
    index: number;
    communitySlug: string;
    onRemove: () => void;
}) {
    const {
        control,
        register,
        formState: { errors },
    } = useFormContext<CommunityFormValues>();

    const planErrors = errors.floorPlans;

    const planSlug = useWatch({ control, name: `floorPlans.${index}.slug` });

    // Folder for all uploads in this floor plan
    const baseFolder =
        communitySlug && planSlug
            ? `communities/${communitySlug}/${planSlug}`
            : "uploads";

    // Images already uploaded to the gallery — used for the hero selector
    const gallery = useWatch({
        control,
        name: `floorPlans.${index}.gallery`,
    });
    const galleryImages = (gallery ?? [])
        .filter((m) => m.type === "IMAGE" && m.src?.startsWith("http"))
        .map((m) => m.src);

    return (
        <div className="rounded-lg border p-4">
            <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-semibold">
                    Floor Plan #{index + 1}
                </span>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={onRemove}
                    aria-label="Remove floor plan"
                >
                    <Trash2 />
                </Button>
            </div>

            <FieldGroup className="gap-4">
                <div className="grid gap-3 sm:grid-cols-2">
                    <Field
                        data-invalid={
                            planErrors?.[index]?.name ? true : undefined
                        }
                    >
                        <FieldLabel>Name</FieldLabel>
                        <Input
                            placeholder="Bella"
                            aria-invalid={
                                planErrors?.[index]?.name ? true : undefined
                            }
                            {...register(`floorPlans.${index}.name`)}
                        />
                        {planErrors?.[index]?.name && (
                            <FieldError
                                errors={[
                                    { message: planErrors[index]?.name?.message },
                                ]}
                            />
                        )}
                    </Field>
                    <Field
                        data-invalid={
                            planErrors?.[index]?.slug ? true : undefined
                        }
                    >
                        <FieldLabel>Slug</FieldLabel>
                        <Input
                            placeholder="bella"
                            aria-invalid={
                                planErrors?.[index]?.slug ? true : undefined
                            }
                            {...register(`floorPlans.${index}.slug`)}
                        />
                        {planErrors?.[index]?.slug && (
                            <FieldError
                                errors={[
                                    { message: planErrors[index]?.slug?.message },
                                ]}
                            />
                        )}
                    </Field>
                </div>

                <Field>
                    <FieldLabel>Brand (optional)</FieldLabel>
                    <Input
                        placeholder="Tradition Series℠"
                        {...register(`floorPlans.${index}.brand`)}
                    />
                </Field>

                <div className="grid gap-3 sm:grid-cols-3">
                    <Field
                        data-invalid={
                            planErrors?.[index]?.startingPrice ? true : undefined
                        }
                    >
                        <FieldLabel>Starting price ($)</FieldLabel>
                        <Input
                            inputMode="numeric"
                            placeholder="484990"
                            aria-invalid={
                                planErrors?.[index]?.startingPrice
                                    ? true
                                    : undefined
                            }
                            {...register(`floorPlans.${index}.startingPrice`)}
                        />
                        {planErrors?.[index]?.startingPrice && (
                            <FieldError
                                errors={[
                                    {
                                        message: planErrors[index]?.startingPrice
                                            ?.message,
                                    },
                                ]}
                            />
                        )}
                    </Field>
                    <Field
                        data-invalid={
                            planErrors?.[index]?.sqft ? true : undefined
                        }
                    >
                        <FieldLabel>Sq. ft.</FieldLabel>
                        <Input
                            inputMode="numeric"
                            placeholder="1446"
                            aria-invalid={
                                planErrors?.[index]?.sqft ? true : undefined
                            }
                            {...register(`floorPlans.${index}.sqft`)}
                        />
                        {planErrors?.[index]?.sqft && (
                            <FieldError
                                errors={[
                                    { message: planErrors[index]?.sqft?.message },
                                ]}
                            />
                        )}
                    </Field>
                    <Field
                        data-invalid={
                            planErrors?.[index]?.stories ? true : undefined
                        }
                    >
                        <FieldLabel>Stories</FieldLabel>
                        <Input
                            inputMode="numeric"
                            placeholder="2"
                            aria-invalid={
                                planErrors?.[index]?.stories ? true : undefined
                            }
                            {...register(`floorPlans.${index}.stories`)}
                        />
                    </Field>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                    <Field
                        data-invalid={
                            planErrors?.[index]?.beds ? true : undefined
                        }
                    >
                        <FieldLabel>Beds</FieldLabel>
                        <Input
                            inputMode="numeric"
                            placeholder="3"
                            aria-invalid={
                                planErrors?.[index]?.beds ? true : undefined
                            }
                            {...register(`floorPlans.${index}.beds`)}
                        />
                    </Field>
                    <Field
                        data-invalid={
                            planErrors?.[index]?.baths ? true : undefined
                        }
                    >
                        <FieldLabel>Baths</FieldLabel>
                        <Input
                            inputMode="decimal"
                            placeholder="2.5"
                            aria-invalid={
                                planErrors?.[index]?.baths ? true : undefined
                            }
                            {...register(`floorPlans.${index}.baths`)}
                        />
                    </Field>
                    <Field
                        data-invalid={
                            planErrors?.[index]?.garage ? true : undefined
                        }
                    >
                        <FieldLabel>Garage</FieldLabel>
                        <Input
                            inputMode="numeric"
                            placeholder="2"
                            aria-invalid={
                                planErrors?.[index]?.garage ? true : undefined
                            }
                            {...register(`floorPlans.${index}.garage`)}
                        />
                    </Field>
                </div>

                <Field
                    data-invalid={
                        planErrors?.[index]?.modelVideo ? true : undefined
                    }
                >
                    <FieldLabel>Model video URL (optional)</FieldLabel>
                    <Input
                        placeholder="https://youtu.be/..."
                        aria-invalid={
                            planErrors?.[index]?.modelVideo ? true : undefined
                        }
                        {...register(`floorPlans.${index}.modelVideo`)}
                    />
                    {planErrors?.[index]?.modelVideo && (
                        <FieldError
                            errors={[
                                {
                                    message: planErrors[index]?.modelVideo
                                        ?.message,
                                },
                            ]}
                        />
                    )}
                </Field>

                <Field>
                    <FieldLabel>Description (optional)</FieldLabel>
                    <Textarea
                        rows={4}
                        placeholder="Describe this floor plan..."
                        {...register(`floorPlans.${index}.description`)}
                    />
                </Field>

                <Field>
                    <FieldLabel>Diagram image (optional)</FieldLabel>
                    <FieldDescription>
                        Floor plan diagram or layout image.
                    </FieldDescription>
                    <Controller
                        control={control}
                        name={`floorPlans.${index}.diagramImage`}
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
                        name={`floorPlans.${index}.gallery`}
                        folder={`${baseFolder}/gallery`}
                    />
                </div>

                <Field
                    data-invalid={
                        planErrors?.[index]?.image ? true : undefined
                    }
                >
                    <FieldLabel>Hero image</FieldLabel>
                    <FieldDescription>
                        Select one image from the gallery above as the thumbnail.
                    </FieldDescription>
                    <Controller
                        control={control}
                        name={`floorPlans.${index}.image`}
                        render={({ field }) => (
                            <ImageSelector
                                images={galleryImages}
                                value={field.value}
                                onChange={field.onChange}
                                invalid={Boolean(planErrors?.[index]?.image)}
                                emptyText="Upload gallery images first"
                            />
                        )}
                    />
                    {planErrors?.[index]?.image && (
                        <FieldError
                            errors={[
                                { message: planErrors[index]?.image?.message },
                            ]}
                        />
                    )}
                </Field>
            </FieldGroup>
        </div>
    );
}
