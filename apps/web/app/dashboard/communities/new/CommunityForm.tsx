"use client";

import { useEffect, useState } from "react";
import { useForm, FormProvider, Controller, useWatch } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
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
import { AmenitiesField } from "./_components/AmenitiesField";
import { ImagePicker } from "@/components/ImagePicker";
import { createCommunity, updateCommunity } from "@/api/community";

type County = { id: string; name: string; region: string };

const toSlug = (v: string) =>
    v
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");

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
    lat: "",
    lng: "",
    about: "",
    countyId: "",
    amenities: [],
    schools: [],
};

export function CommunityForm({
    counties,
    communityId,
    initialValues,
    submitLabel = "Save community",
}: {
    counties: County[];
    /** When set, the form edits this community instead of creating one. */
    communityId?: string;
    initialValues?: Partial<CommunityFormValues>;
    submitLabel?: string;
}) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const countyParam = searchParams.get("county") ?? "";

    const form = useForm<CommunityFormValues, unknown, CommunityFormOutput>({
        resolver: zodResolver(communitySchema),
        defaultValues: {
            ...defaultValues,
            countyId: countyParam,
            ...initialValues,
        },
        mode: "onBlur",
    });

    const {
        register,
        control,
        handleSubmit,
        reset,
        setValue,
        formState: { errors, isSubmitting },
    } = form;

    const slug = useWatch({ control, name: "slug" });
    const name = useWatch({ control, name: "name" });

    // Auto-fill the slug from the name while creating, until the user edits the
    // slug themselves. In edit mode the slug already exists, so leave it alone.
    const [slugDirty, setSlugDirty] = useState(Boolean(communityId));
    useEffect(() => {
        if (!slugDirty) {
            setValue("slug", toSlug(name ?? ""), { shouldValidate: false });
        }
    }, [name, slugDirty, setValue]);

    const onSubmit = async (values: CommunityFormOutput) => {
        try {
            const community = communityId
                ? await updateCommunity(communityId, values)
                : await createCommunity(values);
            toast.success(`"${values.name}" saved successfully.`);
            router.push(`/dashboard/communities/${community.slug}`);
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
                                    Upload the main image shown for this community.
                                </p>
                                <Controller
                                    control={control}
                                    name="image"
                                    render={({ field }) => (
                                        <ImagePicker
                                            value={field.value}
                                            onChange={field.onChange}
                                            onBlur={field.onBlur}
                                            folder={`communities/${slug || "new"}`}
                                            invalid={Boolean(errors.image)}
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

                {/* Map location */}
                <Card>
                    <CardHeader>
                        <CardTitle>Map location</CardTitle>
                        <CardDescription>
                            Coordinates for the map pin. Bed, bath, garage and
                            story ranges, smallest sq. ft. and starting price are
                            derived automatically from this community&apos;s floor
                            plans.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <FieldGroup className="gap-4">
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
                            Search existing amenities or create new ones.
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
                        {submitLabel}
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
