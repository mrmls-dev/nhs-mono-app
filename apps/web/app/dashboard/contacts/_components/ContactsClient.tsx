"use client";

import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    Loader2,
    RefreshCw,
    SquarePen,
    Search,
    Users,
    TriangleAlert,
    Lock,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import { Input } from "@workspace/ui/components/input";
import { Textarea } from "@workspace/ui/components/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@workspace/ui/components/select";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from "@workspace/ui/components/sheet";
import {
    Field,
    FieldError,
    FieldGroup,
    FieldLabel,
    FieldDescription,
} from "@workspace/ui/components/field";
import {
    Empty,
    EmptyContent,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
    EmptyDescription,
} from "@workspace/ui/components/empty";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { useSession, isPlatformAdmin } from "@/lib/auth-client";
import {
    getMarketingContacts,
    syncMarketingContacts,
    updateMarketingContact,
    LEAD_STATUSES,
    LAST_OUTREACHES,
    LEAD_STATUS_LABELS,
    LAST_OUTREACH_LABELS,
    type MarketingContact,
    type LeadStatus,
} from "@/api/marketing-contacts";

const editSchema = z.object({
    phone: z.string().max(40, "Too long").optional(),
    leadStatus: z.enum(LEAD_STATUSES),
    lastOutreach: z.enum(LAST_OUTREACHES),
    note: z.string().max(2000, "Too long").optional(),
});
type EditFormValues = z.infer<typeof editSchema>;

/** Lead-status badge tone — converted = positive, dead = muted/destructive. */
const STATUS_TONE: Record<LeadStatus, string> = {
    NEW: "border-primary/30 bg-primary/10 text-primary",
    ATTEMPTING: "border-amber-500/30 bg-amber-500/10 text-amber-600",
    CONTACTED: "border-blue-500/30 bg-blue-500/10 text-blue-600",
    CONVERTED: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
    NOT_INTERESTED: "text-muted-foreground",
    DO_NOT_CALL: "border-destructive/30 bg-destructive/10 text-destructive",
};

function fullName(c: MarketingContact): string {
    const name = [c.firstName, c.lastName].filter(Boolean).join(" ").trim();
    return name || "—";
}

export function ContactsClient() {
    const { data: session } = useSession();
    const qc = useQueryClient();

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<LeadStatus | "ALL">("ALL");
    const [editTarget, setEditTarget] = useState<MarketingContact | null>(null);

    const {
        data: contacts,
        isPending,
        isError,
    } = useQuery<MarketingContact[]>({
        queryKey: ["marketing-contacts"],
        queryFn: getMarketingContacts,
        enabled: isPlatformAdmin(session?.user),
    });

    const syncMutation = useMutation({
        mutationFn: syncMarketingContacts,
        onSuccess: (r) => {
            qc.invalidateQueries({ queryKey: ["marketing-contacts"] });
            toast.success(
                `Synced ${r.total} contact${r.total === 1 ? "" : "s"} — ${r.created} new, ${r.updated} updated.`,
            );
        },
        onError: (err: Error) => toast.error(err.message),
    });

    const editForm = useForm<EditFormValues>({
        resolver: zodResolver(editSchema),
        defaultValues: {
            phone: "",
            leadStatus: "NEW",
            lastOutreach: "NONE",
            note: "",
        },
    });

    useEffect(() => {
        if (editTarget) {
            editForm.reset({
                phone: editTarget.phone ?? "",
                leadStatus: editTarget.leadStatus,
                lastOutreach: editTarget.lastOutreach,
                note: editTarget.note ?? "",
            });
        }
    }, [editTarget, editForm]);

    const updateMutation = useMutation({
        mutationFn: ({ id, input }: { id: string; input: EditFormValues }) =>
            updateMarketingContact(id, input),
        onSuccess: (updated) => {
            qc.invalidateQueries({ queryKey: ["marketing-contacts"] });
            if (updated.phoneSyncError) {
                toast.warning(
                    "Saved locally, but the phone push to GHL failed. Try again.",
                );
            } else {
                toast.success(`${fullName(updated)} updated.`);
            }
            setEditTarget(null);
        },
        onError: (err: Error) => toast.error(err.message),
    });

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return (contacts ?? []).filter((c) => {
            if (statusFilter !== "ALL" && c.leadStatus !== statusFilter) {
                return false;
            }
            if (!q) return true;
            const haystack = [
                c.firstName,
                c.lastName,
                c.email,
                c.phone,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();
            return haystack.includes(q);
        });
    }, [contacts, search, statusFilter]);

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

    const onEdit = (values: EditFormValues) => {
        if (editTarget) updateMutation.mutate({ id: editTarget.id, input: values });
    };
    const editErrors = editForm.formState.errors;

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Contacts
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Engaged leads from your email campaigns ·{" "}
                        {contacts?.length ?? 0} total
                    </p>
                </div>
                <Button
                    onClick={() => syncMutation.mutate()}
                    disabled={syncMutation.isPending}
                >
                    {syncMutation.isPending ? (
                        <Loader2 data-icon="inline-start" className="animate-spin" />
                    ) : (
                        <RefreshCw data-icon="inline-start" />
                    )}
                    Fetch latest
                </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-56">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search name, email, or phone…"
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Select
                    value={statusFilter}
                    onValueChange={(v) => setStatusFilter(v as LeadStatus | "ALL")}
                >
                    <SelectTrigger className="w-48">
                        <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All statuses</SelectItem>
                        {LEAD_STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>
                                {LEAD_STATUS_LABELS[s]}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {isPending ? (
                <div className="flex flex-col gap-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full rounded-lg" />
                    ))}
                </div>
            ) : isError ? (
                <p className="text-sm text-destructive">
                    Could not load contacts. Make sure the API is running.
                </p>
            ) : filtered.length > 0 ? (
                <div className="overflow-hidden rounded-lg border">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-muted/50 text-left text-muted-foreground">
                                <th className="px-4 py-3 font-medium">Contact</th>
                                <th className="px-4 py-3 font-medium">Phone</th>
                                <th className="px-4 py-3 font-medium hidden lg:table-cell">
                                    Tags
                                </th>
                                <th className="px-4 py-3 font-medium">Status</th>
                                <th className="px-4 py-3 font-medium hidden md:table-cell">
                                    Last outreach
                                </th>
                                <th className="px-4 py-3 font-medium text-right">
                                    <span className="sr-only">Actions</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((c, i) => (
                                <tr
                                    key={c.id}
                                    className={`transition-colors hover:bg-muted/50 ${
                                        i < filtered.length - 1 ? "border-b" : ""
                                    }`}
                                >
                                    <td className="px-4 py-3">
                                        <div className="flex flex-col">
                                            <span className="font-medium">
                                                {fullName(c)}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {c.email ?? "—"}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1.5">
                                            <span
                                                className={
                                                    c.phone
                                                        ? ""
                                                        : "text-muted-foreground"
                                                }
                                            >
                                                {c.phone ?? "Add number"}
                                            </span>
                                            {c.phoneSyncError && (
                                                <TriangleAlert
                                                    className="size-3.5 text-amber-600"
                                                    aria-label="Phone not synced to GHL"
                                                />
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 hidden lg:table-cell">
                                        <div className="flex flex-wrap gap-1">
                                            {c.tags.length > 0 ? (
                                                c.tags.map((t) => (
                                                    <Badge
                                                        key={t}
                                                        variant="secondary"
                                                        className="font-normal"
                                                    >
                                                        {t}
                                                    </Badge>
                                                ))
                                            ) : (
                                                <span className="text-muted-foreground">
                                                    —
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge
                                            variant="outline"
                                            className={STATUS_TONE[c.leadStatus]}
                                        >
                                            {LEAD_STATUS_LABELS[c.leadStatus]}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                                        {LAST_OUTREACH_LABELS[c.lastOutreach]}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex justify-end">
                                            <Button
                                                variant="ghost"
                                                size="icon-sm"
                                                aria-label={`Edit ${fullName(c)}`}
                                                className="text-muted-foreground hover:text-foreground"
                                                onClick={() => setEditTarget(c)}
                                            >
                                                <SquarePen />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <Empty className="border border-dashed">
                    <EmptyHeader>
                        <EmptyMedia variant="icon">
                            <Users />
                        </EmptyMedia>
                        <EmptyTitle>
                            {contacts && contacts.length > 0
                                ? "No matching contacts"
                                : "No contacts yet"}
                        </EmptyTitle>
                        <EmptyDescription>
                            {contacts && contacts.length > 0
                                ? "Try a different search or status filter."
                                : "Click “Fetch latest” to pull engaged contacts from GHL."}
                        </EmptyDescription>
                    </EmptyHeader>
                    {(!contacts || contacts.length === 0) && (
                        <EmptyContent>
                            <Button
                                onClick={() => syncMutation.mutate()}
                                disabled={syncMutation.isPending}
                            >
                                {syncMutation.isPending ? (
                                    <Loader2
                                        data-icon="inline-start"
                                        className="animate-spin"
                                    />
                                ) : (
                                    <RefreshCw data-icon="inline-start" />
                                )}
                                Fetch latest
                            </Button>
                        </EmptyContent>
                    )}
                </Empty>
            )}

            {/* Edit sheet */}
            <Sheet
                open={editTarget !== null}
                onOpenChange={(open) => {
                    if (!open) setEditTarget(null);
                }}
            >
                <SheetContent side="right" className="overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>
                            {editTarget ? fullName(editTarget) : "Edit contact"}
                        </SheetTitle>
                        <SheetDescription>
                            {editTarget?.email ?? "Update this lead's details."}
                        </SheetDescription>
                    </SheetHeader>

                    <form
                        onSubmit={editForm.handleSubmit(onEdit)}
                        className="flex flex-col gap-4 px-4"
                        noValidate
                    >
                        <FieldGroup className="gap-4">
                            <Field
                                data-invalid={
                                    editErrors.phone ? true : undefined
                                }
                            >
                                <FieldLabel htmlFor="edit-phone">
                                    Phone
                                </FieldLabel>
                                <Input
                                    id="edit-phone"
                                    type="tel"
                                    placeholder="+1 (555) 123-4567"
                                    aria-invalid={
                                        editErrors.phone ? true : undefined
                                    }
                                    {...editForm.register("phone")}
                                />
                                <FieldDescription>
                                    Saving a new or changed number also updates it
                                    in GoHighLevel.
                                </FieldDescription>
                                {editTarget?.phoneSyncError && (
                                    <p className="text-xs text-amber-600">
                                        Last GHL sync failed:{" "}
                                        {editTarget.phoneSyncError}
                                    </p>
                                )}
                                {editErrors.phone && (
                                    <FieldError
                                        errors={[
                                            { message: editErrors.phone.message },
                                        ]}
                                    />
                                )}
                            </Field>

                            <Field>
                                <FieldLabel htmlFor="edit-status">
                                    Lead status
                                </FieldLabel>
                                <Controller
                                    control={editForm.control}
                                    name="leadStatus"
                                    render={({ field }) => (
                                        <Select
                                            value={field.value}
                                            onValueChange={field.onChange}
                                        >
                                            <SelectTrigger id="edit-status">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {LEAD_STATUSES.map((s) => (
                                                    <SelectItem
                                                        key={s}
                                                        value={s}
                                                    >
                                                        {LEAD_STATUS_LABELS[s]}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </Field>

                            <Field>
                                <FieldLabel htmlFor="edit-outreach">
                                    Last outreach
                                </FieldLabel>
                                <Controller
                                    control={editForm.control}
                                    name="lastOutreach"
                                    render={({ field }) => (
                                        <Select
                                            value={field.value}
                                            onValueChange={field.onChange}
                                        >
                                            <SelectTrigger id="edit-outreach">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {LAST_OUTREACHES.map((o) => (
                                                    <SelectItem
                                                        key={o}
                                                        value={o}
                                                    >
                                                        {LAST_OUTREACH_LABELS[o]}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </Field>

                            <Field
                                data-invalid={editErrors.note ? true : undefined}
                            >
                                <FieldLabel htmlFor="edit-note">Note</FieldLabel>
                                <Textarea
                                    id="edit-note"
                                    rows={4}
                                    placeholder="Call notes, context, next steps…"
                                    aria-invalid={
                                        editErrors.note ? true : undefined
                                    }
                                    {...editForm.register("note")}
                                />
                                {editErrors.note && (
                                    <FieldError
                                        errors={[
                                            { message: editErrors.note.message },
                                        ]}
                                    />
                                )}
                            </Field>
                        </FieldGroup>
                    </form>

                    <SheetFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setEditTarget(null)}
                            disabled={updateMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={updateMutation.isPending}
                            onClick={editForm.handleSubmit(onEdit)}
                        >
                            {updateMutation.isPending && (
                                <Loader2
                                    data-icon="inline-start"
                                    className="animate-spin"
                                />
                            )}
                            Save changes
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </div>
    );
}
