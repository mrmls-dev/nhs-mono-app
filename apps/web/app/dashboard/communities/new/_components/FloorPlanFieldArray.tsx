"use client";

import { Controller, useFieldArray, useFormContext } from "react-hook-form";
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
import { ImagePicker } from "@/components/ImagePicker";
import type { CommunityFormValues } from "../community-schema";
import { MediaFieldArray } from "./MediaFieldArray";

export function FloorPlanFieldArray() {
    const {
        control,
        register,
        formState: { errors },
    } = useFormContext<CommunityFormValues>();

    const { fields, append, remove } = useFieldArray({
        control,
        name: "floorPlans",
    });

    const planErrors = errors.floorPlans;

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
                    <div key={field.id} className="rounded-lg border p-4">
                        <div className="mb-4 flex items-center justify-between">
                            <span className="text-sm font-semibold">
                                Floor Plan #{index + 1}
                            </span>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => remove(index)}
                                aria-label="Remove floor plan"
                            >
                                <Trash2 />
                            </Button>
                        </div>

                        <FieldGroup className="gap-4">
                            <div className="grid gap-3 sm:grid-cols-2">
                                <Field
                                    data-invalid={
                                        planErrors?.[index]?.name
                                            ? true
                                            : undefined
                                    }
                                >
                                    <FieldLabel>Name</FieldLabel>
                                    <Input
                                        placeholder="Bella"
                                        aria-invalid={
                                            planErrors?.[index]?.name
                                                ? true
                                                : undefined
                                        }
                                        {...register(`floorPlans.${index}.name`)}
                                    />
                                    {planErrors?.[index]?.name && (
                                        <FieldError
                                            errors={[
                                                {
                                                    message: planErrors[index]
                                                        ?.name?.message,
                                                },
                                            ]}
                                        />
                                    )}
                                </Field>
                                <Field
                                    data-invalid={
                                        planErrors?.[index]?.slug
                                            ? true
                                            : undefined
                                    }
                                >
                                    <FieldLabel>Slug</FieldLabel>
                                    <Input
                                        placeholder="bella"
                                        aria-invalid={
                                            planErrors?.[index]?.slug
                                                ? true
                                                : undefined
                                        }
                                        {...register(`floorPlans.${index}.slug`)}
                                    />
                                    {planErrors?.[index]?.slug && (
                                        <FieldError
                                            errors={[
                                                {
                                                    message: planErrors[index]
                                                        ?.slug?.message,
                                                },
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
                                        planErrors?.[index]?.startingPrice
                                            ? true
                                            : undefined
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
                                        {...register(
                                            `floorPlans.${index}.startingPrice`,
                                        )}
                                    />
                                    {planErrors?.[index]?.startingPrice && (
                                        <FieldError
                                            errors={[
                                                {
                                                    message: planErrors[index]
                                                        ?.startingPrice
                                                        ?.message,
                                                },
                                            ]}
                                        />
                                    )}
                                </Field>
                                <Field
                                    data-invalid={
                                        planErrors?.[index]?.sqft
                                            ? true
                                            : undefined
                                    }
                                >
                                    <FieldLabel>Sq. ft.</FieldLabel>
                                    <Input
                                        inputMode="numeric"
                                        placeholder="1446"
                                        aria-invalid={
                                            planErrors?.[index]?.sqft
                                                ? true
                                                : undefined
                                        }
                                        {...register(`floorPlans.${index}.sqft`)}
                                    />
                                    {planErrors?.[index]?.sqft && (
                                        <FieldError
                                            errors={[
                                                {
                                                    message: planErrors[index]
                                                        ?.sqft?.message,
                                                },
                                            ]}
                                        />
                                    )}
                                </Field>
                                <Field
                                    data-invalid={
                                        planErrors?.[index]?.stories
                                            ? true
                                            : undefined
                                    }
                                >
                                    <FieldLabel>Stories</FieldLabel>
                                    <Input
                                        inputMode="numeric"
                                        placeholder="2"
                                        aria-invalid={
                                            planErrors?.[index]?.stories
                                                ? true
                                                : undefined
                                        }
                                        {...register(
                                            `floorPlans.${index}.stories`,
                                        )}
                                    />
                                </Field>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-3">
                                <Field
                                    data-invalid={
                                        planErrors?.[index]?.beds
                                            ? true
                                            : undefined
                                    }
                                >
                                    <FieldLabel>Beds</FieldLabel>
                                    <Input
                                        inputMode="numeric"
                                        placeholder="3"
                                        aria-invalid={
                                            planErrors?.[index]?.beds
                                                ? true
                                                : undefined
                                        }
                                        {...register(`floorPlans.${index}.beds`)}
                                    />
                                </Field>
                                <Field
                                    data-invalid={
                                        planErrors?.[index]?.baths
                                            ? true
                                            : undefined
                                    }
                                >
                                    <FieldLabel>Baths</FieldLabel>
                                    <Input
                                        inputMode="decimal"
                                        placeholder="2.5"
                                        aria-invalid={
                                            planErrors?.[index]?.baths
                                                ? true
                                                : undefined
                                        }
                                        {...register(
                                            `floorPlans.${index}.baths`,
                                        )}
                                    />
                                </Field>
                                <Field
                                    data-invalid={
                                        planErrors?.[index]?.garage
                                            ? true
                                            : undefined
                                    }
                                >
                                    <FieldLabel>Garage</FieldLabel>
                                    <Input
                                        inputMode="numeric"
                                        placeholder="2"
                                        aria-invalid={
                                            planErrors?.[index]?.garage
                                                ? true
                                                : undefined
                                        }
                                        {...register(
                                            `floorPlans.${index}.garage`,
                                        )}
                                    />
                                </Field>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <Field
                                    data-invalid={
                                        planErrors?.[index]?.image
                                            ? true
                                            : undefined
                                    }
                                >
                                    <FieldLabel>Image</FieldLabel>
                                    <Controller
                                        control={control}
                                        name={`floorPlans.${index}.image`}
                                        render={({ field }) => (
                                            <ImagePicker
                                                value={field.value}
                                                onChange={field.onChange}
                                                onBlur={field.onBlur}
                                                invalid={Boolean(
                                                    planErrors?.[index]?.image,
                                                )}
                                            />
                                        )}
                                    />
                                    {planErrors?.[index]?.image && (
                                        <FieldError
                                            errors={[
                                                {
                                                    message: planErrors[index]
                                                        ?.image?.message,
                                                },
                                            ]}
                                        />
                                    )}
                                </Field>
                                <Field>
                                    <FieldLabel>
                                        Diagram image (optional)
                                    </FieldLabel>
                                    <Controller
                                        control={control}
                                        name={`floorPlans.${index}.diagramImage`}
                                        render={({ field }) => (
                                            <ImagePicker
                                                value={field.value}
                                                onChange={field.onChange}
                                                onBlur={field.onBlur}
                                            />
                                        )}
                                    />
                                </Field>
                            </div>

                            <Field
                                data-invalid={
                                    planErrors?.[index]?.modelVideo
                                        ? true
                                        : undefined
                                }
                            >
                                <FieldLabel>Model video URL (optional)</FieldLabel>
                                <Input
                                    placeholder="https://youtu.be/..."
                                    aria-invalid={
                                        planErrors?.[index]?.modelVideo
                                            ? true
                                            : undefined
                                    }
                                    {...register(
                                        `floorPlans.${index}.modelVideo`,
                                    )}
                                />
                                {planErrors?.[index]?.modelVideo && (
                                    <FieldError
                                        errors={[
                                            {
                                                message: planErrors[index]
                                                    ?.modelVideo?.message,
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
                                    {...register(
                                        `floorPlans.${index}.description`,
                                    )}
                                />
                            </Field>

                            <Separator />

                            <div className="flex flex-col gap-2">
                                <FieldLabel>Floor plan gallery</FieldLabel>
                                <FieldDescription>
                                    Images and videos specific to this floor
                                    plan.
                                </FieldDescription>
                                <MediaFieldArray
                                    name={`floorPlans.${index}.gallery`}
                                />
                            </div>
                        </FieldGroup>
                    </div>
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
