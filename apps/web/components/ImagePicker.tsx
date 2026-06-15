"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";
import { Button } from "@workspace/ui/components/button";
import { uploadFile } from "@/api/storage";

type ImagePickerProps = {
    value?: string;
    onChange: (value: string) => void;
    onBlur?: () => void;
    invalid?: boolean;
    id?: string;
    className?: string;
    /** R2 folder path, e.g. "communities/blossom-trail/gallery". Defaults to "uploads". */
    folder?: string;
};

export function ImagePicker({
    value,
    onChange,
    onBlur,
    invalid,
    id,
    className,
    folder = "uploads",
}: ImagePickerProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        return () => {
            if (preview) URL.revokeObjectURL(preview);
        };
    }, [preview]);

    const handleFile = async (file: File | undefined) => {
        if (!file) return;
        if (preview) URL.revokeObjectURL(preview);
        const blobUrl = URL.createObjectURL(file);
        setPreview(blobUrl);
        setUploading(true);
        try {
            const { url } = await uploadFile(file, folder);
            onChange(url);
        } catch {
            onChange("");
            setPreview(null);
            URL.revokeObjectURL(blobUrl);
        } finally {
            setUploading(false);
        }
    };

    const clear = () => {
        if (preview) URL.revokeObjectURL(preview);
        setPreview(null);
        onChange("");
        if (inputRef.current) inputRef.current.value = "";
    };

    const imageSrc = preview ?? (value?.startsWith("http") ? value : null);

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
                        {imageSrc ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={imageSrc}
                                alt="Selected preview"
                                className="size-full object-cover"
                            />
                        ) : (
                            <span className="px-3 text-center text-xs text-muted-foreground">
                                {value}
                            </span>
                        )}
                        {uploading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                                <Loader2 className="size-6 animate-spin text-foreground" />
                            </div>
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
                                disabled={uploading}
                                onClick={() => inputRef.current?.click()}
                            >
                                Replace
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-xs"
                                disabled={uploading}
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
                    disabled={uploading}
                    onClick={() => inputRef.current?.click()}
                    aria-invalid={invalid || undefined}
                    className="flex h-36 w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-muted-foreground transition-colors hover:bg-muted aria-invalid:border-destructive disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:size-6"
                >
                    {uploading ? <Loader2 className="animate-spin" /> : <ImagePlus />}
                    <span className="text-sm">
                        {uploading ? "Uploading…" : "Click to select an image"}
                    </span>
                </button>
            )}
        </div>
    );
}
