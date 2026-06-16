"use client";

import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Button } from "@workspace/ui/components/button";
import { Switch } from "@workspace/ui/components/switch";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@workspace/ui/components/select";
import { updateAgent, type Agent } from "@/api/agent";
import { z } from "zod";
import {
    US_STATES,
    GHL_TIMEZONES,
    BUSINESS_TYPES,
} from "../../../../new-agent/new-agent-schema";
import { editAgentSchema } from "../edit-agent-schema";

type EditAgentInput = z.input<typeof editAgentSchema>;
type EditAgentOutput = z.output<typeof editAgentSchema>;

function SectionHeader({
    step,
    title,
    description,
}: {
    step: string;
    title: string;
    description: string;
}) {
    return (
        <CardHeader>
            <div className="flex items-center gap-2">
                <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                    {step}
                </span>
                <CardTitle>{title}</CardTitle>
            </div>
            <CardDescription>{description}</CardDescription>
        </CardHeader>
    );
}

export function EditAgentForm({ agent }: { agent: Agent }) {
    const router = useRouter();
    const queryClient = useQueryClient();

    const {
        register,
        control,
        handleSubmit,
        formState: { errors, isDirty },
    } = useForm<EditAgentInput, unknown, EditAgentOutput>({
        resolver: zodResolver(editAgentSchema),
        defaultValues: {
            ownerFirstName: agent.ownerFirstName ?? "",
            ownerLastName: agent.ownerLastName ?? "",
            ownerEmail: agent.ownerEmail ?? "",
            name: agent.name,
            slug: agent.slug,
            businessType: agent.businessType ?? "",
            website: agent.website ?? "",
            businessEmail: agent.businessEmail ?? "",
            contactPhone: agent.contactPhone ?? "",
            address: agent.address ?? "",
            city: agent.city ?? "",
            state: agent.state ?? "",
            postalCode: agent.postalCode ?? "",
            country: agent.country ?? "US",
            timezone: agent.timezone ?? "",
            ghlAllowDuplicateContact: agent.ghlAllowDuplicateContact,
            ghlAllowDuplicateOpportunity: agent.ghlAllowDuplicateOpportunity,
            ghlAllowFacebookNameMerge: agent.ghlAllowFacebookNameMerge,
            ghlDisableContactTimezone: agent.ghlDisableContactTimezone,
        },
    });

    const mutation = useMutation({
        mutationFn: (values: EditAgentOutput) =>
            updateAgent(agent.id, {
                ownerFirstName: values.ownerFirstName,
                ownerLastName: values.ownerLastName,
                ownerEmail: values.ownerEmail,
                name: values.name,
                slug: values.slug,
                businessEmail: values.businessEmail || undefined,
                contactPhone: values.contactPhone || undefined,
                website: values.website || undefined,
                businessType: values.businessType || undefined,
                address: values.address || undefined,
                city: values.city || undefined,
                state: values.state || undefined,
                postalCode: values.postalCode || undefined,
                country: values.country || undefined,
                timezone: values.timezone || undefined,
                ghlAllowDuplicateContact: values.ghlAllowDuplicateContact,
                ghlAllowDuplicateOpportunity: values.ghlAllowDuplicateOpportunity,
                ghlAllowFacebookNameMerge: values.ghlAllowFacebookNameMerge,
                ghlDisableContactTimezone: values.ghlDisableContactTimezone,
            }),
        onSuccess: (updated) => {
            queryClient.invalidateQueries({ queryKey: ["agents"] });
            toast.success(`${updated.name} updated.`);
            router.push(`/dashboard/agents/${updated.id}/details`);
        },
        onError: (err: Error) => toast.error(err.message),
    });

    const submitting = mutation.isPending;
    const onSubmit = (values: EditAgentOutput) => mutation.mutate(values);

    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="flex flex-col gap-6"
        >
            {/* ── 1. Owner account ──────────────────────────────────────────── */}
            <Card>
                <SectionHeader
                    step="1"
                    title="Owner account"
                    description="The agent's platform login identity. Changing the email updates the login they sign in with."
                />
                <CardContent>
                    <FieldGroup className="grid gap-4 sm:grid-cols-2">
                        <Field
                            data-invalid={
                                errors.ownerFirstName ? true : undefined
                            }
                        >
                            <FieldLabel htmlFor="ownerFirstName">
                                First name
                            </FieldLabel>
                            <Input
                                id="ownerFirstName"
                                placeholder="Jordan"
                                {...register("ownerFirstName")}
                            />
                            {errors.ownerFirstName && (
                                <FieldError
                                    errors={[
                                        {
                                            message:
                                                errors.ownerFirstName.message,
                                        },
                                    ]}
                                />
                            )}
                        </Field>

                        <Field
                            data-invalid={
                                errors.ownerLastName ? true : undefined
                            }
                        >
                            <FieldLabel htmlFor="ownerLastName">
                                Last name
                            </FieldLabel>
                            <Input
                                id="ownerLastName"
                                placeholder="Reyes"
                                {...register("ownerLastName")}
                            />
                            {errors.ownerLastName && (
                                <FieldError
                                    errors={[
                                        {
                                            message:
                                                errors.ownerLastName.message,
                                        },
                                    ]}
                                />
                            )}
                        </Field>

                        <Field
                            className="sm:col-span-2"
                            data-invalid={errors.ownerEmail ? true : undefined}
                        >
                            <FieldLabel htmlFor="ownerEmail">
                                Login email
                            </FieldLabel>
                            <Input
                                id="ownerEmail"
                                type="email"
                                placeholder="jordan@reyesrealty.com"
                                {...register("ownerEmail")}
                            />
                            {errors.ownerEmail && (
                                <FieldError
                                    errors={[
                                        { message: errors.ownerEmail.message },
                                    ]}
                                />
                            )}
                        </Field>
                    </FieldGroup>
                </CardContent>
            </Card>

            {/* ── 2. Organization ───────────────────────────────────────────── */}
            <Card>
                <SectionHeader
                    step="2"
                    title="Organization"
                    description="The white-label site identity and platform slug."
                />
                <CardContent>
                    <FieldGroup className="grid gap-4 sm:grid-cols-2">
                        <Field
                            className="sm:col-span-2"
                            data-invalid={errors.name ? true : undefined}
                        >
                            <FieldLabel htmlFor="name">Company name</FieldLabel>
                            <Input
                                id="name"
                                placeholder="Reyes Realty Group"
                                {...register("name")}
                            />
                            {errors.name && (
                                <FieldError
                                    errors={[{ message: errors.name.message }]}
                                />
                            )}
                        </Field>

                        <Field data-invalid={errors.slug ? true : undefined}>
                            <FieldLabel htmlFor="slug">Slug</FieldLabel>
                            <Input
                                id="slug"
                                placeholder="reyes-realty"
                                className="font-mono"
                                {...register("slug")}
                            />
                            <FieldDescription>
                                Changing this changes the agent&apos;s public
                                URL — slug.nationalhousesearch.com. Existing
                                links will break.
                            </FieldDescription>
                            {errors.slug && (
                                <FieldError
                                    errors={[{ message: errors.slug.message }]}
                                />
                            )}
                        </Field>

                        <Field>
                            <FieldLabel htmlFor="businessType">
                                Business type
                            </FieldLabel>
                            <Controller
                                control={control}
                                name="businessType"
                                render={({ field }) => (
                                    <Select
                                        value={field.value}
                                        onValueChange={field.onChange}
                                    >
                                        <SelectTrigger id="businessType">
                                            <SelectValue placeholder="Select type…" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                {BUSINESS_TYPES.map((t) => (
                                                    <SelectItem
                                                        key={t}
                                                        value={t}
                                                    >
                                                        {t}
                                                    </SelectItem>
                                                ))}
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </Field>

                        <Field
                            className="sm:col-span-2"
                            data-invalid={errors.website ? true : undefined}
                        >
                            <FieldLabel htmlFor="website">Website</FieldLabel>
                            <Input
                                id="website"
                                type="url"
                                placeholder="https://reyesrealtygroup.com"
                                {...register("website")}
                            />
                            {errors.website && (
                                <FieldError
                                    errors={[
                                        { message: errors.website.message },
                                    ]}
                                />
                            )}
                        </Field>
                    </FieldGroup>
                </CardContent>
            </Card>

            {/* ── 3. Business contact (GHL prospectInfo) ────────────────────── */}
            <Card>
                <SectionHeader
                    step="3"
                    title="Business contact"
                    description="Public-facing contact details sent to GHL as prospectInfo. Business email defaults to the login email if left blank."
                />
                <CardContent>
                    <FieldGroup className="grid gap-4 sm:grid-cols-2">
                        <Field
                            data-invalid={
                                errors.businessEmail ? true : undefined
                            }
                        >
                            <FieldLabel htmlFor="businessEmail">
                                Business email
                            </FieldLabel>
                            <Input
                                id="businessEmail"
                                type="email"
                                placeholder="Same as login email"
                                {...register("businessEmail")}
                            />
                            {errors.businessEmail && (
                                <FieldError
                                    errors={[
                                        {
                                            message:
                                                errors.businessEmail.message,
                                        },
                                    ]}
                                />
                            )}
                        </Field>

                        <Field
                            data-invalid={
                                errors.contactPhone ? true : undefined
                            }
                        >
                            <FieldLabel htmlFor="contactPhone">
                                Business phone
                            </FieldLabel>
                            <Input
                                id="contactPhone"
                                type="tel"
                                placeholder="+1 305 555 0142"
                                {...register("contactPhone")}
                            />
                            {errors.contactPhone && (
                                <FieldError
                                    errors={[
                                        {
                                            message:
                                                errors.contactPhone.message,
                                        },
                                    ]}
                                />
                            )}
                        </Field>
                    </FieldGroup>
                </CardContent>
            </Card>

            {/* ── 4. Address ────────────────────────────────────────────────── */}
            <Card>
                <SectionHeader
                    step="4"
                    title="Address"
                    description="Business location — required by GHL to create a sub-account."
                />
                <CardContent>
                    <FieldGroup className="grid gap-4 sm:grid-cols-2">
                        <Field
                            className="sm:col-span-2"
                            data-invalid={errors.address ? true : undefined}
                        >
                            <FieldLabel htmlFor="address">
                                Street address
                            </FieldLabel>
                            <Input
                                id="address"
                                placeholder="4th Fleet Street"
                                {...register("address")}
                            />
                            {errors.address && (
                                <FieldError
                                    errors={[
                                        { message: errors.address.message },
                                    ]}
                                />
                            )}
                        </Field>

                        <Field data-invalid={errors.city ? true : undefined}>
                            <FieldLabel htmlFor="city">City</FieldLabel>
                            <Input
                                id="city"
                                placeholder="Miami"
                                {...register("city")}
                            />
                            {errors.city && (
                                <FieldError
                                    errors={[{ message: errors.city.message }]}
                                />
                            )}
                        </Field>

                        <Field data-invalid={errors.state ? true : undefined}>
                            <FieldLabel htmlFor="state">State</FieldLabel>
                            <Controller
                                control={control}
                                name="state"
                                render={({ field }) => (
                                    <Select
                                        value={field.value}
                                        onValueChange={field.onChange}
                                    >
                                        <SelectTrigger id="state">
                                            <SelectValue placeholder="Select state…" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                {US_STATES.map(([code, label]) => (
                                                    <SelectItem
                                                        key={code}
                                                        value={code}
                                                    >
                                                        {label}
                                                    </SelectItem>
                                                ))}
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.state && (
                                <FieldError
                                    errors={[
                                        { message: errors.state.message },
                                    ]}
                                />
                            )}
                        </Field>

                        <Field
                            data-invalid={errors.postalCode ? true : undefined}
                        >
                            <FieldLabel htmlFor="postalCode">
                                ZIP / Postal code
                            </FieldLabel>
                            <Input
                                id="postalCode"
                                placeholder="33101"
                                {...register("postalCode")}
                            />
                            {errors.postalCode && (
                                <FieldError
                                    errors={[
                                        {
                                            message: errors.postalCode.message,
                                        },
                                    ]}
                                />
                            )}
                        </Field>

                        <Field>
                            <FieldLabel htmlFor="timezone">Timezone</FieldLabel>
                            <Controller
                                control={control}
                                name="timezone"
                                render={({ field }) => (
                                    <Select
                                        value={field.value}
                                        onValueChange={field.onChange}
                                    >
                                        <SelectTrigger id="timezone">
                                            <SelectValue placeholder="Select timezone…" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                {GHL_TIMEZONES.map((tz) => (
                                                    <SelectItem
                                                        key={tz.value}
                                                        value={tz.value}
                                                    >
                                                        {tz.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </Field>
                    </FieldGroup>
                </CardContent>
            </Card>

            {/* ── 5. GHL settings ───────────────────────────────────────────── */}
            <Card>
                <SectionHeader
                    step="5"
                    title="GHL settings"
                    description="GoHighLevel location settings applied when the sub-account is created. Defaults are recommended for most agents."
                />
                <CardContent>
                    <div className="flex flex-col divide-y">
                        {(
                            [
                                {
                                    name: "ghlAllowDuplicateContact",
                                    label: "Allow duplicate contacts",
                                    description:
                                        "Permit multiple contacts with the same email or phone.",
                                },
                                {
                                    name: "ghlAllowDuplicateOpportunity",
                                    label: "Allow duplicate opportunities",
                                    description:
                                        "Permit multiple open opportunities for the same contact.",
                                },
                                {
                                    name: "ghlAllowFacebookNameMerge",
                                    label: "Allow Facebook name merge",
                                    description:
                                        "Merge contact names from Facebook lead ads.",
                                },
                                {
                                    name: "ghlDisableContactTimezone",
                                    label: "Disable contact timezone detection",
                                    description:
                                        "Use the location timezone for all contacts instead of detecting per-contact.",
                                },
                            ] as const
                        ).map(({ name, label, description }) => (
                            <div
                                key={name}
                                className="flex items-center justify-between gap-4 py-4"
                            >
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-sm font-medium">
                                        {label}
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                        {description}
                                    </span>
                                </div>
                                <Controller
                                    control={control}
                                    name={name}
                                    render={({ field }) => (
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                            aria-label={label}
                                        />
                                    )}
                                />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* ── Actions ───────────────────────────────────────────────────── */}
            <div className="flex items-center justify-end gap-3">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                        router.push(`/dashboard/agents/${agent.id}/details`)
                    }
                    disabled={submitting}
                >
                    Cancel
                </Button>
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
        </form>
    );
}
