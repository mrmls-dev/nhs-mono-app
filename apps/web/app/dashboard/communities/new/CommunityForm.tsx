"use client";

import { useForm, FormProvider, Controller, useWatch } from "react-hook-form";
import { ImageSelector } from "./_components/ImageSelector";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@workspace/ui/components/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@workspace/ui/components/card";
import {
    Field,
    FieldError,
    FieldGroup,
    FieldLabel,
} from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import { Textarea } from "@workspace/ui/components/textarea";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@workspace/ui/components/select";
import {
    communitySchema,
    type CommunityFormValues,
    type CommunityFormOutput,
} from "./community-schema";
import { SchoolFieldArray } from "./_components/SchoolFieldArray";
import { FloorPlanFieldArray } from "./_components/FloorPlanFieldArray";
import { AmenitiesField } from "./_components/AmenitiesField";
import { createCommunity } from "@/api/community";

type County = { id: string; name: string; region: string };

const STATUS_LABELS: Record<string, string> = {
    NOW_SELLING: "Now Selling",
    COMING_SOON: "Coming Soon",
    SOLD_OUT: "Sold Out",
};

const defaultValues: CommunityFormValues = {
    slug: "",
    name: "",
    brand: "",
    location: "",
    image: "",
    status: "NOW_SELLING",
    homesForSale: "0",
    bedsMin: "",
    bedsMax: "",
    bathsMin: "",
    bathsMax: "",
    garageMin: "",
    garageMax: "",
    storiesMin: "",
    storiesMax: "",
    sqftFrom: "",
    priceFrom: "",
    lat: "",
    lng: "",
    about: "",
    countyId: "",
    amenities: [],
    schools: [],
    floorPlans: [],
};

export function CommunityForm({ counties }: { counties: County[] }) {
    const form = useForm<CommunityFormValues, unknown, CommunityFormOutput>({
        resolver: zodResolver(communitySchema),
        defaultValues,
        mode: "onBlur",
    });

    const {
        register,
        control,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = form;

    const floorPlans = useWatch({ control, name: "floorPlans" });
    const allGalleryImages = floorPlans
        .flatMap((fp) => fp.gallery ?? [])
        .filter((m) => m.type === "IMAGE" && m.src?.startsWith("http"))
        .map((m) => m.src);

    const onSubmit = async (values: CommunityFormOutput) => {
        try {
            await createCommunity(values);
            toast.success(`"${values.name}" saved successfully.`);
            reset();
        } catch (err: unknown) {
            toast.error(
                err instanceof Error ? err.message : "Something went wrong",
            );
        }
    };

    const onError = () => {
        toast.error("Please fix the highlighted fields.");
    };

    return (
        <FormProvider {...form}>
            <form
                onSubmit={handleSubmit(onSubmit, onError)}
                className="flex flex-col gap-6"
                noValidate
            >
                {/* Basics */}
                <Card>
                    <CardHeader>
                        <CardTitle>Basics</CardTitle>
                        <CardDescription>
                            Core identity and status of the community.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <FieldGroup className="gap-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field data-invalid={errors.name ? true : undefined}>
                                    <FieldLabel>Name</FieldLabel>
                                    <Input
                                        placeholder="Blossom Trail"
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
                                        placeholder="blossom-trail"
                                        aria-invalid={errors.slug ? true : undefined}
                                        {...register("slug")}
                                    />
                                    {errors.slug && (
                                        <FieldError
                                            errors={[{ message: errors.slug.message }]}
                                        />
                                    )}
                                </Field>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field>
                                    <FieldLabel>Brand (optional)</FieldLabel>
                                    <Input
                                        placeholder="Tradition Series℠"
                                        {...register("brand")}
                                    />
                                </Field>
                                <Field
                                    data-invalid={errors.status ? true : undefined}
                                >
                                    <FieldLabel>Status</FieldLabel>
                                    <Controller
                                        control={control}
                                        name="status"
                                        render={({ field }) => (
                                            <Select
                                                value={field.value}
                                                onValueChange={field.onChange}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectGroup>
                                                        {Object.entries(
                                                            STATUS_LABELS,
                                                        ).map(([value, label]) => (
                                                            <SelectItem
                                                                key={value}
                                                                value={value}
                                                            >
                                                                {label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectGroup>
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </Field>
                            </div>

                            <Field data-invalid={errors.location ? true : undefined}>
                                <FieldLabel>Location (address)</FieldLabel>
                                <Input
                                    placeholder="5505 Begonia Circle, Greenacres, FL 33463"
                                    aria-invalid={errors.location ? true : undefined}
                                    {...register("location")}
                                />
                                {errors.location && (
                                    <FieldError
                                        errors={[{ message: errors.location.message }]}
                                    />
                                )}
                            </Field>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field
                                    data-invalid={errors.countyId ? true : undefined}
                                >
                                    <FieldLabel>County</FieldLabel>
                                    <Controller
                                        control={control}
                                        name="countyId"
                                        render={({ field }) => (
                                            <Select
                                                value={field.value}
                                                onValueChange={field.onChange}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a county" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectGroup>
                                                        {counties.map((county) => (
                                                            <SelectItem
                                                                key={county.id}
                                                                value={county.id}
                                                            >
                                                                {county.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectGroup>
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                    {errors.countyId && (
                                        <FieldError
                                            errors={[
                                                { message: errors.countyId.message },
                                            ]}
                                        />
                                    )}
                                </Field>
                                <Field
                                    data-invalid={
                                        errors.homesForSale ? true : undefined
                                    }
                                >
                                    <FieldLabel>Homes for sale</FieldLabel>
                                    <Input
                                        inputMode="numeric"
                                        placeholder="0"
                                        aria-invalid={
                                            errors.homesForSale ? true : undefined
                                        }
                                        {...register("homesForSale")}
                                    />
                                    {errors.homesForSale && (
                                        <FieldError
                                            errors={[
                                                {
                                                    message:
                                                        errors.homesForSale.message,
                                                },
                                            ]}
                                        />
                                    )}
                                </Field>
                            </div>

                            <Field data-invalid={errors.image ? true : undefined}>
                                <FieldLabel>Hero image</FieldLabel>
                                <p className="text-sm text-muted-foreground">
                                    Select one image from the floor plan galleries below.
                                </p>
                                <Controller
                                    control={control}
                                    name="image"
                                    render={({ field }) => (
                                        <ImageSelector
                                            images={allGalleryImages}
                                            value={field.value}
                                            onChange={field.onChange}
                                            invalid={Boolean(errors.image)}
                                            emptyText="Add floor plan gallery images first"
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
                    </CardContent>
                </Card>

                {/* Specs */}
                <Card>
                    <CardHeader>
                        <CardTitle>Specifications</CardTitle>
                        <CardDescription>
                            Ranges across all floor plans. Set min and max to the
                            same value for a single figure.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <FieldGroup className="gap-4">
                            <div className="grid gap-4 sm:grid-cols-4">
                                <RangeField
                                    label="Beds min"
                                    error={errors.bedsMin?.message}
                                    {...register("bedsMin")}
                                />
                                <RangeField
                                    label="Beds max"
                                    error={errors.bedsMax?.message}
                                    {...register("bedsMax")}
                                />
                                <RangeField
                                    label="Baths min"
                                    decimal
                                    error={errors.bathsMin?.message}
                                    {...register("bathsMin")}
                                />
                                <RangeField
                                    label="Baths max"
                                    decimal
                                    error={errors.bathsMax?.message}
                                    {...register("bathsMax")}
                                />
                            </div>
                            <div className="grid gap-4 sm:grid-cols-4">
                                <RangeField
                                    label="Garage min"
                                    error={errors.garageMin?.message}
                                    {...register("garageMin")}
                                />
                                <RangeField
                                    label="Garage max"
                                    error={errors.garageMax?.message}
                                    {...register("garageMax")}
                                />
                                <RangeField
                                    label="Stories min"
                                    error={errors.storiesMin?.message}
                                    {...register("storiesMin")}
                                />
                                <RangeField
                                    label="Stories max"
                                    error={errors.storiesMax?.message}
                                    {...register("storiesMax")}
                                />
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <RangeField
                                    label="Smallest sq. ft."
                                    error={errors.sqftFrom?.message}
                                    {...register("sqftFrom")}
                                />
                                <RangeField
                                    label="Starting price ($)"
                                    error={errors.priceFrom?.message}
                                    {...register("priceFrom")}
                                />
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <RangeField
                                    label="Latitude"
                                    decimal
                                    error={errors.lat?.message}
                                    {...register("lat")}
                                />
                                <RangeField
                                    label="Longitude"
                                    decimal
                                    error={errors.lng?.message}
                                    {...register("lng")}
                                />
                            </div>
                        </FieldGroup>
                    </CardContent>
                </Card>

                {/* About */}
                <Card>
                    <CardHeader>
                        <CardTitle>About</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Field data-invalid={errors.about ? true : undefined}>
                            <FieldLabel className="sr-only">About</FieldLabel>
                            <Textarea
                                rows={6}
                                placeholder="Describe the community..."
                                aria-invalid={errors.about ? true : undefined}
                                {...register("about")}
                            />
                            {errors.about && (
                                <FieldError
                                    errors={[{ message: errors.about.message }]}
                                />
                            )}
                        </Field>
                    </CardContent>
                </Card>

                {/* Amenities */}
                <Card>
                    <CardHeader>
                        <CardTitle>Amenities</CardTitle>
                        <CardDescription>
                            Select all amenities offered.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AmenitiesField />
                    </CardContent>
                </Card>

                {/* Schools */}
                <Card>
                    <CardHeader>
                        <CardTitle>Schools</CardTitle>
                        <CardDescription>Nearby schools.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <SchoolFieldArray />
                    </CardContent>
                </Card>

                {/* Floor Plans */}
                <Card>
                    <CardHeader>
                        <CardTitle>Floor Plans</CardTitle>
                        <CardDescription>
                            Floor plans available in this community, each with its
                            own gallery.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <FloorPlanFieldArray />
                    </CardContent>
                </Card>

                <div className="flex items-center justify-end gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => reset()}
                        disabled={isSubmitting}
                    >
                        Reset
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        <Save data-icon="inline-start" />
                        Save community
                    </Button>
                </div>
            </form>
        </FormProvider>
    );
}

// Small wrapper for the numeric range/coordinate inputs.
function RangeField({
    label,
    error,
    decimal,
    ref,
    ...props
}: React.ComponentProps<"input"> & {
    label: string;
    error?: string;
    decimal?: boolean;
}) {
    return (
        <Field data-invalid={error ? true : undefined}>
            <FieldLabel>{label}</FieldLabel>
            <Input
                inputMode={decimal ? "decimal" : "numeric"}
                aria-invalid={error ? true : undefined}
                ref={ref}
                {...props}
            />
            {error && <FieldError errors={[{ message: error }]} />}
        </Field>
    );
}
