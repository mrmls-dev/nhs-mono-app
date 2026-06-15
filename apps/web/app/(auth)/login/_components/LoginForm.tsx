"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2, Loader2 } from "lucide-react";
import { signIn } from "@/lib/auth-client";
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
import { Alert, AlertDescription } from "@workspace/ui/components/alert";

const loginSchema = z.object({
    email: z.string().min(1, "Email is required").email("Enter a valid email"),
    password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: "", password: "" },
    });

    const onSubmit = async (values: LoginFormValues) => {
        setFormError(null);
        setSubmitting(true);
        const { error } = await signIn.email({
            email: values.email,
            password: values.password,
        });
        if (error) {
            setSubmitting(false);
            setFormError(
                error.message ?? "Invalid email or password. Please try again.",
            );
            return;
        }
        // Full reload so middleware + server components see the new session cookie.
        router.push("/dashboard");
        router.refresh();
    };

    return (
        <div className="flex w-full max-w-sm flex-col gap-6">
            <div className="flex flex-col items-center gap-2 text-center">
                <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <Building2 className="size-5" />
                </div>
                <h1 className="text-xl font-semibold tracking-tight">
                    National House Search
                </h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Sign in</CardTitle>
                    <CardDescription>
                        Enter your credentials to access your dashboard.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {formError && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertDescription>{formError}</AlertDescription>
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} noValidate>
                        <FieldGroup>
                            <Field data-invalid={errors.email ? true : undefined}>
                                <FieldLabel htmlFor="email">Email</FieldLabel>
                                <Input
                                    id="email"
                                    type="email"
                                    autoComplete="email"
                                    placeholder="you@example.com"
                                    aria-invalid={errors.email ? true : undefined}
                                    {...register("email")}
                                />
                                {errors.email && (
                                    <FieldError
                                        errors={[{ message: errors.email.message }]}
                                    />
                                )}
                            </Field>

                            <Field
                                data-invalid={errors.password ? true : undefined}
                            >
                                <FieldLabel htmlFor="password">
                                    Password
                                </FieldLabel>
                                <Input
                                    id="password"
                                    type="password"
                                    autoComplete="current-password"
                                    placeholder="••••••••"
                                    aria-invalid={
                                        errors.password ? true : undefined
                                    }
                                    {...register("password")}
                                />
                                {errors.password && (
                                    <FieldError
                                        errors={[
                                            { message: errors.password.message },
                                        ]}
                                    />
                                )}
                            </Field>

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={submitting}
                            >
                                {submitting && (
                                    <Loader2
                                        data-icon="inline-start"
                                        className="animate-spin"
                                    />
                                )}
                                Sign in
                            </Button>
                        </FieldGroup>
                    </form>
                </CardContent>
            </Card>

            <p className="text-center text-xs text-muted-foreground">
                Access is provisioned by National House Search. Contact your
                administrator if you need an account.
            </p>
        </div>
    );
}
