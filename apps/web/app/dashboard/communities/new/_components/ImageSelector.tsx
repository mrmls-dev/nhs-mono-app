"use client";

import { Check } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";

type ImageSelectorProps = {
    images: string[];
    value?: string;
    onChange: (url: string) => void;
    invalid?: boolean;
    emptyText?: string;
};

export function ImageSelector({
    images,
    value,
    onChange,
    invalid,
    emptyText = "Upload gallery images first",
}: ImageSelectorProps) {
    if (images.length === 0) {
        return (
            <div
                className={cn(
                    "flex h-24 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground",
                    invalid && "border-destructive text-destructive",
                )}
            >
                {emptyText}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {images.map((url) => {
                const selected = value === url;
                return (
                    <button
                        key={url}
                        type="button"
                        onClick={() => onChange(url)}
                        className={cn(
                            "relative overflow-hidden rounded-md border-2 transition-all",
                            selected
                                ? "border-primary ring-2 ring-primary/30"
                                : "border-transparent hover:border-muted-foreground/40",
                        )}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={url}
                            alt=""
                            className="aspect-square w-full object-cover"
                        />
                        {selected && (
                            <div className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                <Check className="size-3" />
                            </div>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
