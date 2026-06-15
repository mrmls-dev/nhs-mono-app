"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Copy, Globe, Trash2, RefreshCw } from "lucide-react";
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
} from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import { Button } from "@workspace/ui/components/button";
import {
    setDomain as setDomainApi,
    refreshDomainStatus,
    removeDomain as removeDomainApi,
    type Agent,
} from "@/api/agent";
import { DomainStatusBadge } from "./StatusChips";

// What agents CNAME their custom domain at — Vercel issues + serves the cert.
// Mirrors the API's VERCEL_CNAME_TARGET; override per-environment.
const CNAME_TARGET =
    process.env.NEXT_PUBLIC_AGENT_CNAME_TARGET ?? "cname.vercel-dns.com";

const domainSchema = z.object({
    domain: z
        .string()
        .min(1, "Domain is required")
        .regex(
            /^(?!-)[a-z0-9-]+(\.[a-z0-9-]+)+$/i,
            "Enter a bare domain, e.g. reyesrealtygroup.com",
        ),
});

type DomainValues = z.infer<typeof domainSchema>;

function dnsRecords(domain: string) {
    return [{ type: "CNAME", name: domain, value: CNAME_TARGET }];
}

export function DomainEditor({ agent }: { agent: Agent }) {
    const queryClient = useQueryClient();
    const domain = agent.customDomain;
    const status = agent.domainStatus;

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<DomainValues>({
        resolver: zodResolver(domainSchema),
        defaultValues: { domain: "" },
    });

    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: ["agents"] });
        queryClient.invalidateQueries({ queryKey: ["my-agent"] });
    };

    const addMutation = useMutation({
        mutationFn: (values: DomainValues) =>
            setDomainApi(agent.id, values.domain.toLowerCase()),
        onSuccess: () => {
            invalidate();
            reset({ domain: "" });
            toast.success("Domain added. Add the DNS records below to verify.");
        },
        onError: (err: Error) => toast.error(err.message),
    });

    const verifyMutation = useMutation({
        mutationFn: () => refreshDomainStatus(agent.id),
        onSuccess: (res) => {
            invalidate();
            toast.success(
                res.domainStatus === "active"
                    ? "Domain verified and live."
                    : "Still pending — DNS may take a few minutes to propagate.",
            );
        },
        onError: (err: Error) => toast.error(err.message),
    });

    const removeMutation = useMutation({
        mutationFn: () => removeDomainApi(agent.id),
        onSuccess: () => {
            invalidate();
            reset({ domain: "" });
            toast.success("Domain removed.");
        },
        onError: (err: Error) => toast.error(err.message),
    });

    const copy = (value: string) => {
        navigator.clipboard?.writeText(value);
        toast.success("Copied to clipboard.");
    };

    const subdomainUrl = agent.subdomain ? `https://${agent.subdomain}` : null;

    return (
        <>
            {agent.subdomain && (
                <Card>
                    <CardHeader>
                        <CardTitle>Your site address</CardTitle>
                        <CardDescription>
                            This address always works — no setup required. A
                            custom domain below is optional.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
                            <div className="flex items-center gap-3">
                                <Globe className="size-5 text-muted-foreground" />
                                <a
                                    href={subdomainUrl ?? undefined}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-medium hover:text-primary hover:underline"
                                >
                                    {agent.subdomain}
                                </a>
                            </div>
                            <div className="flex items-center gap-2">
                                <DomainStatusBadge status="active" />
                                <Button
                                    variant="ghost"
                                    size="icon-xs"
                                    aria-label="Copy site address"
                                    onClick={() => copy(agent.subdomain!)}
                                >
                                    <Copy className="size-4 text-muted-foreground" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Custom domain</CardTitle>
                    <CardDescription>
                        Connect your own domain — optional, points visitors to
                        the same site.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    {domain ? (
                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
                            <div className="flex items-center gap-3">
                                <Globe className="size-5 text-muted-foreground" />
                                <div className="flex flex-col">
                                    <span className="font-medium">{domain}</span>
                                    <span className="text-xs text-muted-foreground">
                                        Points to {CNAME_TARGET}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <DomainStatusBadge status={status} />
                                <Button
                                    variant="ghost"
                                    size="icon-xs"
                                    aria-label="Remove domain"
                                    onClick={() => removeMutation.mutate()}
                                    disabled={removeMutation.isPending}
                                >
                                    <Trash2 className="size-4 text-muted-foreground" />
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <form
                            onSubmit={handleSubmit((v) => addMutation.mutate(v))}
                            noValidate
                        >
                            <FieldGroup>
                                <Field
                                    data-invalid={
                                        errors.domain ? true : undefined
                                    }
                                >
                                    <FieldLabel htmlFor="domain">
                                        Domain
                                    </FieldLabel>
                                    <div className="flex items-start gap-2">
                                        <div className="flex-1">
                                            <Input
                                                id="domain"
                                                placeholder="reyesrealtygroup.com"
                                                aria-invalid={
                                                    errors.domain
                                                        ? true
                                                        : undefined
                                                }
                                                {...register("domain")}
                                            />
                                            {errors.domain && (
                                                <FieldError
                                                    className="mt-2"
                                                    errors={[
                                                        {
                                                            message:
                                                                errors.domain
                                                                    .message,
                                                        },
                                                    ]}
                                                />
                                            )}
                                        </div>
                                        <Button
                                            type="submit"
                                            disabled={addMutation.isPending}
                                        >
                                            {addMutation.isPending && (
                                                <Loader2
                                                    data-icon="inline-start"
                                                    className="animate-spin"
                                                />
                                            )}
                                            Add domain
                                        </Button>
                                    </div>
                                </Field>
                            </FieldGroup>
                        </form>
                    )}
                </CardContent>
            </Card>

            {domain && (
                <Card>
                    <CardHeader>
                        <CardTitle>DNS records</CardTitle>
                        <CardDescription>
                            Add these at your domain registrar.{" "}
                            {status === "pending"
                                ? "Verification can take a few minutes to propagate."
                                : "Your domain is verified and serving traffic."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        <div className="overflow-hidden rounded-lg border">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/50 text-left text-muted-foreground">
                                        <th className="px-4 py-2.5 font-medium">
                                            Type
                                        </th>
                                        <th className="px-4 py-2.5 font-medium">
                                            Name
                                        </th>
                                        <th className="px-4 py-2.5 font-medium">
                                            Value
                                        </th>
                                        <th className="px-4 py-2.5" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {dnsRecords(domain).map((r, i, arr) => (
                                        <tr
                                            key={r.name}
                                            className={
                                                i < arr.length - 1
                                                    ? "border-b"
                                                    : ""
                                            }
                                        >
                                            <td className="px-4 py-2.5 font-mono text-xs">
                                                {r.type}
                                            </td>
                                            <td className="px-4 py-2.5 font-mono text-xs break-all">
                                                {r.name}
                                            </td>
                                            <td className="px-4 py-2.5 font-mono text-xs break-all">
                                                {r.value}
                                            </td>
                                            <td className="px-4 py-2.5">
                                                <Button
                                                    variant="ghost"
                                                    size="icon-xs"
                                                    aria-label={`Copy ${r.type} value`}
                                                    onClick={() => copy(r.value)}
                                                >
                                                    <Copy className="size-4 text-muted-foreground" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {status === "pending" && (
                            <div className="flex justify-end">
                                <Button
                                    variant="outline"
                                    onClick={() => verifyMutation.mutate()}
                                    disabled={verifyMutation.isPending}
                                >
                                    {verifyMutation.isPending ? (
                                        <Loader2
                                            data-icon="inline-start"
                                            className="animate-spin"
                                        />
                                    ) : (
                                        <RefreshCw data-icon="inline-start" />
                                    )}
                                    Check verification
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </>
    );
}
