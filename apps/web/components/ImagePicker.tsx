"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";
import { Button } from "@workspace/ui/components/button";

type ImagePickerProps = {
    /** Current stored value (image URL/path once a backend upload is wired). */
    value?: string;
    onChange: (value: string) => void;
    onBlur?: () => void;
    invalid?: boolean;
    id?: string;
    className?: string;
};

/**
 * Image picker (UI only).
 *
 * Lets the user select an image from their device and shows a local preview.
 * No upload happens yet — when the cloud backend is ready, replace the
 * `onChange(file.name)` call below with the uploaded URL returned by the
 * provider (Cloudinary / Vercel Blob / UploadThing / etc).
 */
export function ImagePicker({
    value,
    onChange,
    onBlur,
    invalid,
    id,
    className,
}: ImagePickerProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);

    // Revoke the object URL when it changes or the component unmounts.
    useEffect(() => {
        return () => {
            if (preview) URL.revokeObjectURL(preview);
        };
    }, [preview]);

    const handleFile = (file: File | undefined) => {
        if (!file) return;
        if (preview) URL.revokeObjectURL(preview);
        setPreview(URL.createObjectURL(file));
        // TODO: upload to cloud and call onChange(uploadedUrl) instead.
        onChange(file.name);
    };

    const clear = () => {
        if (preview) URL.revokeObjectURL(preview);
        setPreview(null);
        onChange("");
        if (inputRef.current) inputRef.current.value = "";
    };

    return (
        <div className={cn("flex flex-col gap-2", className)}>
            <input
                ref={inputRef}
                id={id}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
                onBlur={onBlur}
            />

            {value ? (
                <div className="overflow-hidden rounded-lg border">
                    <div className="relative flex h-36 w-full items-center justify-center bg-muted">
                        {preview ? (
                            // Local blob preview — next/image can't optimize blob: URLs.
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={preview}
                                alt="Selected preview"
                                className="size-full object-cover"
                            />
                        ) : (
                            <span className="px-3 text-center text-xs text-muted-foreground">
                                {value}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center justify-between gap-2 border-t bg-background p-2">
                        <span className="truncate text-xs text-muted-foreground">
                            {value}
                        </span>
                        <div className="flex shrink-0 gap-1">
                            <Button
                                type="button"
                                variant="outline"
                                size="xs"
                                onClick={() => inputRef.current?.click()}
                            >
                                Replace
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-xs"
                                onClick={clear}
                                aria-label="Remove image"
                            >
                                <X />
                            </Button>
                        </div>
                    </div>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    aria-invalid={invalid || undefined}
                    className="flex h-36 w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-muted-foreground transition-colors hover:bg-muted aria-invalid:border-destructive [&_svg]:size-6"
                >
                    <ImagePlus />
                    <span className="text-sm">Click to select an image</span>
                </button>
            )}
        </div>
    );
}
