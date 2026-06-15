"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
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
} from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import { Button } from "@workspace/ui/components/button";
import { authClient, useSession } from "@/lib/auth-client";

const profileSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email(),
});
type ProfileValues = z.infer<typeof profileSchema>;

const passwordSchema = z
    .object({
        currentPassword: z.string().min(1, "Current password is required"),
        newPassword: z.string().min(8, "Use at least 8 characters"),
        confirmPassword: z.string().min(1, "Confirm your new password"),
    })
    .refine((v) => v.newPassword === v.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });
type PasswordValues = z.infer<typeof passwordSchema>;

function ProfileCard() {
    const { data: session } = useSession();
    const [submitting, setSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isDirty },
    } = useForm<ProfileValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: { name: "", email: "" },
    });

    // Seed once the session loads.
    useEffect(() => {
        if (session?.user) {
            reset({
                name: session.user.name ?? "",
                email: session.user.email ?? "",
            });
        }
    }, [session, reset]);

    const onSubmit = async (values: ProfileValues) => {
        setSubmitting(true);
        const { error } = await authClient.updateUser({ name: values.name });
        setSubmitting(false);
        if (error) {
            toast.error(error.message ?? "Failed to update profile.");
            return;
        }
        toast.success("Profile updated.");
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>Your account details.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                    <FieldGroup>
                        <Field data-invalid={errors.name ? true : undefined}>
                            <FieldLabel htmlFor="name">Name</FieldLabel>
                            <Input
                                id="name"
                                aria-invalid={errors.name ? true : undefined}
                                {...register("name")}
                            />
                            {errors.name && (
                                <FieldError
                                    errors={[{ message: errors.name.message }]}
                                />
                            )}
                        </Field>

                        <Field>
                            <FieldLabel htmlFor="email">Email</FieldLabel>
                            <Input
                                id="email"
                                type="email"
                                readOnly
                                disabled
                                {...register("email")}
                            />
                        </Field>

                        <div className="flex justify-end">
                            <Button
                                type="submit"
                                disabled={submitting || !isDirty}
                            >
                                {submitting && (
                                    <Loader2
                                        data-icon="inline-start"
                                        className="animate-spin"
                                    />
                                )}
                                Save profile
                            </Button>
                        </div>
                    </FieldGroup>
                </form>
            </CardContent>
        </Card>
    );
}

function PasswordCard() {
    const [submitting, setSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<PasswordValues>({
        resolver: zodResolver(passwordSchema),
        defaultValues: {
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        },
    });

    const onSubmit = async (values: PasswordValues) => {
        // There is no forgot-password flow, so this is the only way to reset.
        setSubmitting(true);
        const { error } = await authClient.changePassword({
            currentPassword: values.currentPassword,
            newPassword: values.newPassword,
            revokeOtherSessions: true,
        });
        setSubmitting(false);
        if (error) {
            toast.error(
                error.message ?? "Failed to change password. Check your current password.",
            );
            return;
        }
        reset();
        toast.success("Password changed.");
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Change password</CardTitle>
                <CardDescription>
                    There is no password-reset email — update it here.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                    <FieldGroup>
                        <Field
                            data-invalid={
                                errors.currentPassword ? true : undefined
                            }
                        >
                            <FieldLabel htmlFor="currentPassword">
                                Current password
                            </FieldLabel>
                            <Input
                                id="currentPassword"
                                type="password"
                                autoComplete="current-password"
                                aria-invalid={
                                    errors.currentPassword ? true : undefined
                                }
                                {...register("currentPassword")}
                            />
                            {errors.currentPassword && (
                                <FieldError
                                    errors={[
                                        {
                                            message:
                                                errors.currentPassword.message,
                                        },
                                    ]}
                                />
                            )}
                        </Field>

                        <Field
                            data-invalid={errors.newPassword ? true : undefined}
                        >
                            <FieldLabel htmlFor="newPassword">
                                New password
                            </FieldLabel>
                            <Input
                                id="newPassword"
                                type="password"
                                autoComplete="new-password"
                                aria-invalid={
                                    errors.newPassword ? true : undefined
                                }
                                {...register("newPassword")}
                            />
                            {errors.newPassword && (
                                <FieldError
                                    errors={[
                                        { message: errors.newPassword.message },
                                    ]}
                                />
                            )}
                        </Field>

                        <Field
                            data-invalid={
                                errors.confirmPassword ? true : undefined
                            }
                        >
                            <FieldLabel htmlFor="confirmPassword">
                                Confirm new password
                            </FieldLabel>
                            <Input
                                id="confirmPassword"
                                type="password"
                                autoComplete="new-password"
                                aria-invalid={
                                    errors.confirmPassword ? true : undefined
                                }
                                {...register("confirmPassword")}
                            />
                            {errors.confirmPassword && (
                                <FieldError
                                    errors={[
                                        {
                                            message:
                                                errors.confirmPassword.message,
                                        },
                                    ]}
                                />
                            )}
                        </Field>

                        <div className="flex justify-end">
                            <Button type="submit" disabled={submitting}>
                                {submitting && (
                                    <Loader2
                                        data-icon="inline-start"
                                        className="animate-spin"
                                    />
                                )}
                                Change password
                            </Button>
                        </div>
                    </FieldGroup>
                </form>
            </CardContent>
        </Card>
    );
}

export function SettingsClient() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-semibold tracking-tight">
                    Settings
                </h1>
                <p className="text-sm text-muted-foreground">
                    Manage your profile and password.
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <ProfileCard />
                <PasswordCard />
            </div>
        </div>
    );
}
