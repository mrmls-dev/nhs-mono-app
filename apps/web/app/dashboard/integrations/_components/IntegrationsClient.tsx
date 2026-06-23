"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Eye, EyeOff, Lock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
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
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import {
    Empty,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
    EmptyDescription,
} from "@workspace/ui/components/empty";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { useSession, isPlatformAdmin } from "@/lib/auth-client";
import {
    getGhlIntegration,
    saveGhlIntegration,
    type GhlIntegrationStatus,
} from "@/api/integrations";

const schema = z.object({
    locationId: z.string().min(1, "Location ID is required"),
    apiToken: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

function StatusBadge({ status }: { status: GhlIntegrationStatus }) {
    if (!status.configured) {
        return <Badge variant="outline">Not connected</Badge>;
    }
    if (status.status === "error") {
        return (
            <Badge
                variant="outline"
                className="border-destructive/30 bg-destructive/10 text-destructive"
            >
                Error
            </Badge>
        );
    }
    return (
        <Badge
            variant="outline"
            className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
        >
            <CheckCircle2 data-icon="inline-start" />
            Connected
        </Badge>
    );
}

function GhlCard() {
    const qc = useQueryClient();
    const [showToken, setShowToken] = useState(false);

    const { data: ghl, isPending } = useQuery({
        queryKey: ["integration", "ghl"],
        queryFn: getGhlIntegration,
    });

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isDirty },
    } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { locationId: "", apiToken: "" },
    });

    // Seed the location once status loads; the token stays blank (write-only).
    useEffect(() => {
        if (ghl) reset({ locationId: ghl.locationId ?? "", apiToken: "" });
    }, [ghl, reset]);

    const saveMutation = useMutation({
        mutationFn: saveGhlIntegration,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["integration", "ghl"] });
            setShowToken(false);
            toast.success("GoHighLevel connected.");
        },
        onError: (err: Error) => toast.error(err.message),
    });

    const hasToken = Boolean(ghl?.tokenLast4);

    const onSubmit = (values: FormValues) =>
        saveMutation.mutate({
            locationId: values.locationId,
            // Blank → keep the stored token (only resend when actually changed).
            apiToken: values.apiToken?.trim() || undefined,
        });

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between gap-3">
                    <div className="flex flex-col gap-1.5">
                        <CardTitle>GoHighLevel</CardTitle>
                        <CardDescription>
                            Powers the internal Contacts page — fetching engaged
                            leads and syncing phone updates.
                        </CardDescription>
                    </div>
                    {ghl && <StatusBadge status={ghl} />}
                </div>
            </CardHeader>
            <CardContent>
                {isPending ? (
                    <div className="flex flex-col gap-3">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                ) : (
                    <form onSubmit={handleSubmit(onSubmit)} noValidate>
                        <FieldGroup className="gap-4">
                            {ghl?.source === "env" && (
                                <p className="rounded-md border border-dashed bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                                    Currently using credentials from the server
                                    environment. Saving here stores them in the
                                    app instead.
                                </p>
                            )}
                            {ghl?.status === "error" && ghl.lastError && (
                                <p className="text-xs text-destructive">
                                    Last error: {ghl.lastError}
                                </p>
                            )}

                            <Field
                                data-invalid={
                                    errors.locationId ? true : undefined
                                }
                            >
                                <FieldLabel htmlFor="ghl-location">
                                    Location ID
                                </FieldLabel>
                                <Input
                                    id="ghl-location"
                                    placeholder="e.g. ve9EPM428h8vShlRW1KT"
                                    aria-invalid={
                                        errors.locationId ? true : undefined
                                    }
                                    {...register("locationId")}
                                />
                                {errors.locationId && (
                                    <FieldError
                                        errors={[
                                            {
                                                message:
                                                    errors.locationId.message,
                                            },
                                        ]}
                                    />
                                )}
                            </Field>

                            <Field>
                                <FieldLabel htmlFor="ghl-token">
                                    Private Integration Token
                                </FieldLabel>
                                <div className="relative">
                                    <Input
                                        id="ghl-token"
                                        type={showToken ? "text" : "password"}
                                        autoComplete="off"
                                        className="pr-10"
                                        placeholder={
                                            hasToken
                                                ? `Saved ••••${ghl?.tokenLast4} — enter a new token to replace`
                                                : "pit-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                                        }
                                        {...register("apiToken")}
                                    />
                                    <button
                                        type="button"
                                        tabIndex={-1}
                                        aria-label={
                                            showToken
                                                ? "Hide token"
                                                : "Show token"
                                        }
                                        onClick={() => setShowToken((v) => !v)}
                                        className="absolute inset-y-0 right-3 flex items-center text-muted-foreground"
                                    >
                                        {showToken ? (
                                            <EyeOff className="size-4" />
                                        ) : (
                                            <Eye className="size-4" />
                                        )}
                                    </button>
                                </div>
                                <FieldDescription>
                                    GHL → Settings → Private Integrations. Needs
                                    the <code>contacts.readonly</code> and{" "}
                                    <code>contacts.write</code> scopes. Stored
                                    encrypted; never shown again after saving.
                                </FieldDescription>
                            </Field>

                            <div className="flex justify-end">
                                <Button
                                    type="submit"
                                    disabled={
                                        saveMutation.isPending ||
                                        (!isDirty && hasToken)
                                    }
                                >
                                    {saveMutation.isPending && (
                                        <Loader2
                                            data-icon="inline-start"
                                            className="animate-spin"
                                        />
                                    )}
                                    {hasToken ? "Save changes" : "Connect"}
                                </Button>
                            </div>
                        </FieldGroup>
                    </form>
                )}
            </CardContent>
        </Card>
    );
}

export function IntegrationsClient() {
    const { data: session } = useSession();

    if (!isPlatformAdmin(session?.user)) {
        return (
            <Empty className="border border-dashed">
                <EmptyHeader>
                    <EmptyMedia variant="icon">
                        <Lock />
                    </EmptyMedia>
                    <EmptyTitle>Access restricted</EmptyTitle>
                    <EmptyDescription>
                        This page is only available to platform staff.
                    </EmptyDescription>
                </EmptyHeader>
            </Empty>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-semibold tracking-tight">
                    Integrations
                </h1>
                <p className="text-sm text-muted-foreground">
                    Connect third-party services used across the platform.
                </p>
            </div>

            <div className="max-w-2xl">
                <GhlCard />
            </div>
        </div>
    );
}
