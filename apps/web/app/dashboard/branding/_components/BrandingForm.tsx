"use client";

import { useEffect, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Upload, Building2 } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
    FieldDescription,
} from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import { Textarea } from "@workspace/ui/components/textarea";
import { Button } from "@workspace/ui/components/button";
import { updateBranding, type Agent } from "@/api/agent";
import { uploadFile } from "@/api/storage";
import { resolveTheme } from "@/lib/theme";
import { ThemeGenerator } from "./ThemeGenerator";

const HEX = /^#([0-9a-fA-F]{6})$/;
const hex = z.string().regex(HEX, "Use a 6-digit hex color, e.g. #1d4ed8");
const themeColors = z.object({
    primary: hex,
    secondary: hex,
    accent: hex,
});

const brandingSchema = z.object({
    siteName: z.string().min(1, "Site name is required"),
    contactPhone: z.string().max(40, "Too long").optional().or(z.literal("")),
    footerText: z.string().max(300, "Too long").optional().or(z.literal("")),
    theme: z.object({
        fonts: z.object({ heading: z.string(), body: z.string() }),
        radius: z.number().min(0).max(2),
        light: themeColors,
        dark: themeColors,
    }),
});

type BrandingValues = z.infer<typeof brandingSchema>;

const defaults = (agent: Agent): BrandingValues => ({
    siteName: agent.siteName ?? agent.name,
    contactPhone: agent.contactPhone ?? "",
    footerText: agent.footerText ?? "",
    theme: resolveTheme(agent),
});

export function BrandingForm({ agent }: { agent: Agent }) {
    const queryClient = useQueryClient();
    const [logoPreview, setLogoPreview] = useState<string | null>(agent.logo);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const {
        register,
        control,
        handleSubmit,
        reset,
        formState: { errors, isDirty },
    } = useForm<BrandingValues>({
        resolver: zodResolver(brandingSchema),
        defaultValues: defaults(agent),
    });

    // Re-seed when the selected agent changes (admin agent switcher).
    useEffect(() => {
        reset(defaults(agent));
        setLogoPreview(agent.logo);
        setLogoFile(null);
    }, [agent, reset]);

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const mutation = useMutation({
        mutationFn: async (values: BrandingValues) => {
            let logo: string | undefined;
            if (logoFile) {
                const uploaded = await uploadFile(logoFile, `agents/${agent.slug}`);
                logo = uploaded.url;
            }
            return updateBranding(agent.id, {
                ...values,
                // Keep the legacy single color in sync (used by admin color dots).
                brandColor: values.theme.light.primary,
                ...(logo ? { logo } : {}),
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["agents"] });
            queryClient.invalidateQueries({ queryKey: ["my-agent"] });
            setLogoFile(null);
            toast.success("Branding saved.");
        },
        onError: (err: Error) => toast.error(err.message),
    });

    const onSubmit = (values: BrandingValues) => mutation.mutate(values);
    const submitting = mutation.isPending;
    const dirty = isDirty || logoFile !== null;

    return (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Identity</CardTitle>
                    <CardDescription>
                        How {agent.name}&apos;s public site is named and
                        introduced.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <FieldGroup>
                        <Field>
                            <FieldLabel>Logo</FieldLabel>
                            <div className="flex items-center gap-4">
                                <div className="flex size-16 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                                    {logoPreview ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={logoPreview}
                                            alt="Logo preview"
                                            className="size-full object-contain"
                                        />
                                    ) : (
                                        <Building2 className="size-6 text-muted-foreground" />
                                    )}
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleLogoChange}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Upload data-icon="inline-start" />
                                    Upload logo
                                </Button>
                            </div>
                            <FieldDescription>
                                PNG or SVG, transparent background recommended.
                            </FieldDescription>
                        </Field>

                        <Field data-invalid={errors.siteName ? true : undefined}>
                            <FieldLabel htmlFor="siteName">Site name</FieldLabel>
                            <Input
                                id="siteName"
                                placeholder="Reyes Realty — New Homes"
                                aria-invalid={errors.siteName ? true : undefined}
                                {...register("siteName")}
                            />
                            <FieldDescription>
                                Used in the header and the page title / SEO.
                            </FieldDescription>
                            {errors.siteName && (
                                <FieldError
                                    errors={[{ message: errors.siteName.message }]}
                                />
                            )}
                        </Field>

                        <Field
                            data-invalid={errors.contactPhone ? true : undefined}
                        >
                            <FieldLabel htmlFor="contactPhone">
                                Contact phone
                            </FieldLabel>
                            <Input
                                id="contactPhone"
                                placeholder="305-555-0142"
                                aria-invalid={
                                    errors.contactPhone ? true : undefined
                                }
                                {...register("contactPhone")}
                            />
                            {errors.contactPhone && (
                                <FieldError
                                    errors={[
                                        { message: errors.contactPhone.message },
                                    ]}
                                />
                            )}
                        </Field>

                        <Field data-invalid={errors.footerText ? true : undefined}>
                            <FieldLabel htmlFor="footerText">
                                Footer text
                            </FieldLabel>
                            <Textarea
                                id="footerText"
                                rows={3}
                                placeholder="Reyes Realty Group · Your South Florida New-Home Specialists"
                                aria-invalid={
                                    errors.footerText ? true : undefined
                                }
                                {...register("footerText")}
                            />
                            {errors.footerText && (
                                <FieldError
                                    errors={[
                                        { message: errors.footerText.message },
                                    ]}
                                />
                            )}
                        </Field>
                    </FieldGroup>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Theme</CardTitle>
                    <CardDescription>
                        Colors, fonts, and shape applied across the public site
                        in light and dark mode.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Controller
                        control={control}
                        name="theme"
                        render={({ field }) => (
                            <ThemeGenerator
                                value={field.value}
                                onChange={field.onChange}
                            />
                        )}
                    />
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button type="submit" disabled={submitting || !dirty}>
                    {submitting && (
                        <Loader2
                            data-icon="inline-start"
                            className="animate-spin"
                        />
                    )}
                    Save changes
                </Button>
            </div>
        </form>
    );
}
