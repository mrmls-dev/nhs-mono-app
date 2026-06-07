"use client";

import { useRef } from "react";
import {
    Controller,
    useFieldArray,
    useFormContext,
    useWatch,
} from "react-hook-form";
import { Plus, Trash2, ImageIcon, Upload } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import {
    Field,
    FieldError,
    FieldGroup,
    FieldLabel,
} from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@workspace/ui/components/select";
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "@workspace/ui/components/empty";
import { ImagePicker } from "@/components/ImagePicker";
import type { CommunityFormValues } from "../community-schema";

type MediaArrayName = "gallery" | `floorPlans.${number}.gallery`;

type MediaItemErrors = Record<
    "src" | "alt" | "caption" | "type",
    { message?: string } | undefined
>;

export function MediaFieldArray({ name }: { name: MediaArrayName }) {
    const {
        control,
        formState: { errors },
    } = useFormContext<CommunityFormValues>();

    const { fields, append, remove } = useFieldArray({ control, name });

    const bulkInputRef = useRef<HTMLInputElement>(null);

    // Bulk image upload: one IMAGE item per selected file.
    // No upload yet — `src` holds the file name as a placeholder and `alt`
    // defaults to the file name (sans extension). When the cloud backend is
    // ready, upload each file and use the returned URL for `src`.
    const handleBulkFiles = (fileList: FileList | null) => {
        if (!fileList?.length) return;
        for (const file of Array.from(fileList)) {
            append({
                type: "IMAGE",
                src: file.name,
                alt: file.name.replace(/\.[^.]+$/, ""),
                caption: "",
            });
        }
        if (bulkInputRef.current) bulkInputRef.current.value = "";
    };

    // Walk the (possibly nested) error object for this array.
    const arrayErrors = name
        .split(".")
        .reduce<Record<string, unknown> | undefined>(
            (acc, key) => acc?.[key] as Record<string, unknown> | undefined,
            errors as unknown as Record<string, unknown>,
        ) as Array<MediaItemErrors> | undefined;

    return (
        <div className="flex flex-col gap-3">
            {fields.length === 0 ? (
                <Empty className="border border-dashed">
                    <EmptyHeader>
                        <EmptyMedia variant="icon">
                            <ImageIcon />
                        </EmptyMedia>
                        <EmptyTitle>No media yet</EmptyTitle>
                        <EmptyDescription>
                            Add images or YouTube videos for this gallery.
                        </EmptyDescription>
                    </EmptyHeader>
                </Empty>
            ) : (
                fields.map((field, index) => (
                    <MediaRow
                        key={field.id}
                        name={name}
                        index={index}
                        errors={arrayErrors?.[index]}
                        onRemove={() => remove(index)}
                    />
                ))
            )}

            <div className="flex flex-wrap gap-2">
                <input
                    ref={bulkInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleBulkFiles(e.target.files)}
                />
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => bulkInputRef.current?.click()}
                >
                    <Upload data-icon="inline-start" />
                    Upload images
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                        append({ type: "VIDEO", src: "", alt: "", caption: "" })
                    }
                >
                    <Plus data-icon="inline-start" />
                    Add video
                </Button>
            </div>
        </div>
    );
}

function MediaRow({
    name,
    index,
    errors,
    onRemove,
}: {
    name: MediaArrayName;
    index: number;
    errors?: MediaItemErrors;
    onRemove: () => void;
}) {
    const { control, register } = useFormContext<CommunityFormValues>();

    const type = useWatch({ control, name: `${name}.${index}.type` });
    const isVideo = type === "VIDEO";

    return (
        <div className="rounded-lg border p-4">
            <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                    Media #{index + 1}
                </span>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={onRemove}
                    aria-label="Remove media"
                >
                    <Trash2 />
                </Button>
            </div>
            <FieldGroup className="gap-3">
                <Field className="sm:max-w-40">
                    <FieldLabel>Type</FieldLabel>
                    <Controller
                        control={control}
                        name={`${name}.${index}.type`}
                        render={({ field: f }) => (
                            <Select value={f.value} onValueChange={f.onChange}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectItem value="IMAGE">
                                            Image
                                        </SelectItem>
                                        <SelectItem value="VIDEO">
                                            Video (YouTube)
                                        </SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        )}
                    />
                </Field>

                <Field data-invalid={errors?.src ? true : undefined}>
                    <FieldLabel>
                        {isVideo ? "YouTube URL" : "Image"}
                    </FieldLabel>
                    {isVideo ? (
                        <Input
                            placeholder="https://www.youtube.com/watch?v=..."
                            aria-invalid={errors?.src ? true : undefined}
                            {...register(`${name}.${index}.src`)}
                        />
                    ) : (
                        <Controller
                            control={control}
                            name={`${name}.${index}.src`}
                            render={({ field: f }) => (
                                <ImagePicker
                                    value={f.value}
                                    onChange={f.onChange}
                                    onBlur={f.onBlur}
                                    invalid={Boolean(errors?.src)}
                                />
                            )}
                        />
                    )}
                    {errors?.src && (
                        <FieldError errors={[{ message: errors.src.message }]} />
                    )}
                </Field>

                <div className="grid gap-3 sm:grid-cols-2">
                    <Field data-invalid={errors?.alt ? true : undefined}>
                        <FieldLabel>Alt text</FieldLabel>
                        <Input
                            placeholder="Community entrance"
                            aria-invalid={errors?.alt ? true : undefined}
                            {...register(`${name}.${index}.alt`)}
                        />
                        {errors?.alt && (
                            <FieldError
                                errors={[{ message: errors.alt.message }]}
                            />
                        )}
                    </Field>
                    <Field>
                        <FieldLabel>Caption (optional)</FieldLabel>
                        <Input
                            placeholder="Front entry"
                            {...register(`${name}.${index}.caption`)}
                        />
                    </Field>
                </div>
            </FieldGroup>
        </div>
    );
}
