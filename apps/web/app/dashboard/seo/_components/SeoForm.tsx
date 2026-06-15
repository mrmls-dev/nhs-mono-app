"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
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
import { ogPalette } from "@/lib/og-theme";
import { SearchSnippetPreview } from "./SearchSnippetPreview";
import { OgCardPreview } from "./OgCardPreview";

const seoSchema = z.object({
    seoTitle: z.string().max(70, "Keep the title under 70 characters"),
    titleSuffix: z.string().max(70, "Keep the suffix under 70 characters"),
    metaDescription: z
        .string()
        .max(200, "Keep the description under 200 characters"),
});

type SeoValues = z.infer<typeof seoSchema>;

const defaults = (agent: Agent): SeoValues => ({
    seoTitle: agent.seoTitle ?? "",
    titleSuffix: agent.titleSuffix ?? "",
    metaDescription: agent.metaDescription ?? "",
});

export function SeoForm({ agent }: { agent: Agent }) {
    const queryClient = useQueryClient();

    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors, isDirty },
    } = useForm<SeoValues>({
        resolver: zodResolver(seoSchema),
        defaultValues: defaults(agent),
    });

    // Re-seed when the selected agent changes (admin agent switcher).
    useEffect(() => {
        reset(defaults(agent));
    }, [agent, reset]);

    const mutation = useMutation({
        mutationFn: (values: SeoValues) => updateBranding(agent.id, values),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["agents"] });
            queryClient.invalidateQueries({ queryKey: ["my-agent"] });
            toast.success("SEO settings saved.");
        },
        onError: (err: Error) => toast.error(err.message),
    });

    const onSubmit = (values: SeoValues) => mutation.mutate(values);
    const submitting = mutation.isPending;

    // ── Live preview values ─────────────────────────────────────────────────
    const values = watch();
    const fallbackName = agent.siteName ?? agent.name;
    const palette = ogPalette(agent);
    const domain =
        agent.customDomain ?? agent.subdomain ?? "your-site.com";
    const previewTitle = values.seoTitle || fallbackName;
    const previewSuffix = values.titleSuffix || fallbackName;

    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="grid gap-6 lg:grid-cols-2"
        >
            {/* ── Editor ── */}
            <div className="flex flex-col gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Search engine listing</CardTitle>
                        <CardDescription>
                            How {agent.name}&apos;s site appears in Google
                            results and browser tabs.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <FieldGroup>
                            <Field
                                data-invalid={
                                    errors.seoTitle ? true : undefined
                                }
                            >
                                <FieldLabel htmlFor="seoTitle">
                                    Home page title
                                </FieldLabel>
                                <Input
                                    id="seoTitle"
                                    placeholder={fallbackName}
                                    aria-invalid={
                                        errors.seoTitle ? true : undefined
                                    }
                                    {...register("seoTitle")}
                                />
                                <FieldDescription>
                                    The title for your home page. Leave blank to
                                    use your site name.
                                </FieldDescription>
                                {errors.seoTitle && (
                                    <FieldError
                                        errors={[
                                            { message: errors.seoTitle.message },
                                        ]}
                                    />
                                )}
                            </Field>

                            <Field
                                data-invalid={
                                    errors.titleSuffix ? true : undefined
                                }
                            >
                                <FieldLabel htmlFor="titleSuffix">
                                    Title suffix for other pages
                                </FieldLabel>
                                <Input
                                    id="titleSuffix"
                                    placeholder={fallbackName}
                                    aria-invalid={
                                        errors.titleSuffix ? true : undefined
                                    }
                                    {...register("titleSuffix")}
                                />
                                <FieldDescription>
                                    Added after each community / plan name, e.g.
                                    “Blossom Trail | {previewSuffix}”.
                                </FieldDescription>
                                {errors.titleSuffix && (
                                    <FieldError
                                        errors={[
                                            {
                                                message:
                                                    errors.titleSuffix.message,
                                            },
                                        ]}
                                    />
                                )}
                            </Field>

                            <Field
                                data-invalid={
                                    errors.metaDescription ? true : undefined
                                }
                            >
                                <FieldLabel htmlFor="metaDescription">
                                    Meta description
                                </FieldLabel>
                                <Textarea
                                    id="metaDescription"
                                    rows={3}
                                    placeholder="Explore new construction communities across Southeast Florida…"
                                    aria-invalid={
                                        errors.metaDescription ? true : undefined
                                    }
                                    {...register("metaDescription")}
                                />
                                <FieldDescription>
                                    Shown under your link in Google and on social
                                    shares. Aim for 150–160 characters.
                                </FieldDescription>
                                {errors.metaDescription && (
                                    <FieldError
                                        errors={[
                                            {
                                                message:
                                                    errors.metaDescription
                                                        .message,
                                            },
                                        ]}
                                    />
                                )}
                            </Field>
                        </FieldGroup>
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button type="submit" disabled={submitting || !isDirty}>
                        {submitting && (
                            <Loader2
                                data-icon="inline-start"
                                className="animate-spin"
                            />
                        )}
                        Save changes
                    </Button>
                </div>
            </div>

            {/* ── Live preview ── */}
            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-3">
                    <h2 className="text-sm font-medium text-muted-foreground">
                        Google preview
                    </h2>
                    <SearchSnippetPreview
                        title={previewTitle}
                        description={values.metaDescription}
                        domain={domain}
                        subPageExample={`Blossom Trail | ${previewSuffix}`}
                    />
                </div>

                <div className="flex flex-col gap-3">
                    <h2 className="text-sm font-medium text-muted-foreground">
                        Social share preview
                    </h2>
                    <OgCardPreview
                        logo={agent.logo}
                        palette={palette}
                        title={previewTitle}
                        description={values.metaDescription}
                        domain={domain}
                    />
                    <p className="text-xs text-muted-foreground">
                        Card colors come from your{" "}
                        <span className="font-medium">Branding</span> theme and
                        logo. This is an approximation of the shared image.
                    </p>
                </div>
            </div>
        </form>
    );
}
