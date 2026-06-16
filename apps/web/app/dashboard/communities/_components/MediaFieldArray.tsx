"use client";

import { useRef, useState } from "react";
import {
    Controller,
    useFieldArray,
    useFormContext,
    type FieldValues,
    type Path,
} from "react-hook-form";
import { Plus, Trash2, ImageIcon, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@workspace/ui/components/button";
import {
    Field,
    FieldError,
    FieldGroup,
    FieldLabel,
} from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "@workspace/ui/components/empty";
import { ImagePicker } from "@/components/ImagePicker";
import { uploadFile } from "@/api/storage";

type MediaItemErrors = Record<
    "src" | "alt" | "caption",
    { message?: string } | undefined
>;

// Image-only gallery editor. Works for any form whose `name` path is an array
// of { src, alt, caption }. Plan video lives in the separate `modelVideo` field.
export function MediaFieldArray({
    name,
    folder = "uploads",
}: {
    name: string;
    folder?: string;
}) {
    const {
        control,
        formState: { errors },
    } = useFormContext<FieldValues>();

    const { fields, append, remove } = useFieldArray({
        control,
        name: name as Path<FieldValues>,
    });

    const bulkInputRef = useRef<HTMLInputElement>(null);
    const [bulkUploading, setBulkUploading] = useState(false);

    const handleBulkFiles = async (fileList: FileList | null) => {
        if (!fileList?.length) return;
        const files = Array.from(fileList);
        setBulkUploading(true);
        try {
            const results = await Promise.allSettled(
                files.map((f) => uploadFile(f, folder)),
            );
            let failed = 0;
            for (let i = 0; i < files.length; i++) {
                const result = results[i]!;
                if (result.status === "fulfilled") {
                    append({
                        src: result.value.url,
                        alt: files[i]!.name.replace(/\.[^.]+$/, ""),
                        caption: "",
                    });
                } else {
                    failed++;
                }
            }
            if (failed > 0) {
                toast.error(
                    `${failed} image${failed > 1 ? "s" : ""} failed to upload.`,
                );
            }
        } finally {
            setBulkUploading(false);
            if (bulkInputRef.current) bulkInputRef.current.value = "";
        }
    };

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
                        <EmptyTitle>No images yet</EmptyTitle>
                        <EmptyDescription>
                            Upload images for this gallery.
                        </EmptyDescription>
                    </EmptyHeader>
                </Empty>
            ) : (
                fields.map((field, index) => (
                    <MediaRow
                        key={field.id}
                        name={name}
                        index={index}
                        folder={folder}
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
                    disabled={bulkUploading}
                    onClick={() => bulkInputRef.current?.click()}
                >
                    <Upload data-icon="inline-start" />
                    {bulkUploading ? "Uploading…" : "Upload images"}
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={bulkUploading}
                    onClick={() => append({ src: "", alt: "", caption: "" })}
                >
                    <Plus data-icon="inline-start" />
                    Add image
                </Button>
            </div>
        </div>
    );
}

function MediaRow({
    name,
    index,
    folder,
    errors,
    onRemove,
}: {
    name: string;
    index: number;
    folder: string;
    errors?: MediaItemErrors;
    onRemove: () => void;
}) {
    const { control, register } = useFormContext<FieldValues>();

    const srcPath = `${name}.${index}.src` as Path<FieldValues>;
    const altPath = `${name}.${index}.alt` as Path<FieldValues>;
    const captionPath = `${name}.${index}.caption` as Path<FieldValues>;

    return (
        <div className="rounded-lg border p-4">
            <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                    Image #{index + 1}
                </span>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={onRemove}
                    aria-label="Remove image"
                >
                    <Trash2 />
                </Button>
            </div>
            <FieldGroup className="gap-3">
                <Field data-invalid={errors?.src ? true : undefined}>
                    <FieldLabel>Image</FieldLabel>
                    <Controller
                        control={control}
                        name={srcPath}
                        render={({ field: f }) => (
                            <ImagePicker
                                value={f.value}
                                onChange={f.onChange}
                                onBlur={f.onBlur}
                                folder={folder}
                                invalid={Boolean(errors?.src)}
                            />
                        )}
                    />
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
                            {...register(altPath)}
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
                            {...register(captionPath)}
                        />
                    </Field>
                </div>
            </FieldGroup>
        </div>
    );
}
