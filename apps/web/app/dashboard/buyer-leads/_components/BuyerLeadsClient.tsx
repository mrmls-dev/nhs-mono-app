"use client";

import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
    keepPreviousData,
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import {
    Loader2,
    Search,
    Inbox,
    ChevronLeft,
    ChevronRight,
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
} from "@workspace/ui/components/field";
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
    getBuyerLeads,
    updateBuyerLead,
    type BuyerLead,
} from "@/api/buyer-leads";
import {
    LEAD_STATUSES,
    LEAD_STATUS_LABELS,
    type LeadStatus,
} from "@/api/marketing-contacts";

const PAGE_SIZE = 20;

const editSchema = z.object({
    leadStatus: z.enum(LEAD_STATUSES),
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

function fullName(l: BuyerLead): string {
    return [l.firstName, l.lastName].filter(Boolean).join(" ").trim() || "—";
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

/** One survey-answer row in the detail sheet; hides empty values. */
function DetailRow({ label, value }: { label: string; value?: string | null }) {
    if (!value) return null;
    return (
        <div className="flex justify-between gap-4 py-1.5 text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className="text-right font-medium">{value}</span>
        </div>
    );
}

export function BuyerLeadsClient() {
    const { data: session, isPending: sessionPending } = useSession();
    const qc = useQueryClient();
    const isAdmin = isPlatformAdmin(session?.user);

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [page, setPage] = useState(1);
    const [editTarget, setEditTarget] = useState<BuyerLead | null>(null);

    // Debounce the search box; reset to the first page on a new term.
    useEffect(() => {
        const t = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 300);
        return () => clearTimeout(t);
    }, [search]);

    const { data, isPending, isError, isPlaceholderData } = useQuery({
        queryKey: ["buyer-leads", { page, q: debouncedSearch }],
        queryFn: () =>
            getBuyerLeads({
                page,
                pageSize: PAGE_SIZE,
                q: debouncedSearch,
            }),
        enabled: !sessionPending,
        placeholderData: keepPreviousData,
    });

    const leads = data?.data ?? [];
    const total = data?.total ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const filtersActive = debouncedSearch !== "";

    const editForm = useForm<EditFormValues>({
        resolver: zodResolver(editSchema),
        defaultValues: { leadStatus: "NEW", note: "" },
    });

    useEffect(() => {
        if (editTarget) {
            editForm.reset({
                leadStatus: editTarget.leadStatus,
                note: editTarget.note ?? "",
            });
        }
    }, [editTarget, editForm]);

    const updateMutation = useMutation({
        mutationFn: ({ id, input }: { id: string; input: EditFormValues }) =>
            updateBuyerLead(id, input),
        onSuccess: (updated) => {
            qc.invalidateQueries({ queryKey: ["buyer-leads"] });
            toast.success(`${fullName(updated)} updated.`);
            setEditTarget(null);
        },
        onError: (err: Error) => toast.error(err.message),
    });

    const onEdit = (values: EditFormValues) => {
        if (editTarget)
            updateMutation.mutate({ id: editTarget.id, input: values });
    };
    const editErrors = editForm.formState.errors;

    const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
    const rangeEnd = Math.min(page * PAGE_SIZE, total);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-semibold tracking-tight">
                    Buyer Leads
                </h1>
                <p className="text-sm text-muted-foreground">
                    {isAdmin
                        ? "Buyer-match survey submissions across all agents"
                        : "Buyer-match survey submissions from your site"}{" "}
                    · {total} total
                </p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative min-w-56 flex-1">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search name, email, or phone…"
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {isPending ? (
                <div className="flex flex-col gap-2">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full rounded-lg" />
                    ))}
                </div>
            ) : isError ? (
                <p className="text-sm text-destructive">
                    Could not load buyer leads. Make sure the API is running.
                </p>
            ) : leads.length > 0 ? (
                <>
                    <div
                        className={`overflow-hidden rounded-lg border transition-opacity ${
                            isPlaceholderData ? "opacity-60" : ""
                        }`}
                    >
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/50 text-left text-muted-foreground">
                                    <th className="px-4 py-3 font-medium">
                                        Lead
                                    </th>
                                    <th className="px-4 py-3 font-medium hidden md:table-cell">
                                        Phone
                                    </th>
                                    {isAdmin && (
                                        <th className="px-4 py-3 font-medium hidden lg:table-cell">
                                            Agent
                                        </th>
                                    )}
                                    <th className="px-4 py-3 font-medium hidden sm:table-cell">
                                        Matches
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 font-medium text-right">
                                        Created
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {leads.map((l, i) => (
                                    <tr
                                        key={l.id}
                                        onClick={() => setEditTarget(l)}
                                        className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                                            i < leads.length - 1
                                                ? "border-b"
                                                : ""
                                        }`}
                                    >
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col">
                                                <span className="font-medium">
                                                    {fullName(l)}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {l.email}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                                            {l.phone}
                                        </td>
                                        {isAdmin && (
                                            <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                                                {l.organization?.name ?? "—"}
                                            </td>
                                        )}
                                        <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                                            {l.matchCount ?? "—"}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge
                                                variant="outline"
                                                className={
                                                    STATUS_TONE[l.leadStatus]
                                                }
                                            >
                                                {LEAD_STATUS_LABELS[l.leadStatus]}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-right text-muted-foreground">
                                            {formatDate(l.createdAt)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between gap-3">
                        <p className="text-sm text-muted-foreground">
                            {rangeStart}–{rangeEnd} of {total}
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page <= 1 || isPlaceholderData}
                            >
                                <ChevronLeft data-icon="inline-start" />
                                Previous
                            </Button>
                            <span className="text-sm text-muted-foreground">
                                Page {page} of {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    setPage((p) => Math.min(totalPages, p + 1))
                                }
                                disabled={page >= totalPages || isPlaceholderData}
                            >
                                Next
                                <ChevronRight data-icon="inline-end" />
                            </Button>
                        </div>
                    </div>
                </>
            ) : (
                <Empty className="border border-dashed">
                    <EmptyHeader>
                        <EmptyMedia variant="icon">
                            <Inbox />
                        </EmptyMedia>
                        <EmptyTitle>
                            {filtersActive
                                ? "No matching leads"
                                : "No buyer leads yet"}
                        </EmptyTitle>
                        <EmptyDescription>
                            {filtersActive
                                ? "Try a different search."
                                : "Leads from the buyer-match survey will appear here."}
                        </EmptyDescription>
                    </EmptyHeader>
                </Empty>
            )}

            {/* Detail + edit sheet */}
            <Sheet
                open={editTarget !== null}
                onOpenChange={(open) => {
                    if (!open) setEditTarget(null);
                }}
            >
                <SheetContent side="right" className="overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>
                            {editTarget ? fullName(editTarget) : "Lead"}
                        </SheetTitle>
                        <SheetDescription>
                            {editTarget?.email}
                        </SheetDescription>
                    </SheetHeader>

                    {editTarget && (
                        <div className="flex flex-col gap-4 px-4">
                            {/* Survey answers (read-only) */}
                            <div className="rounded-lg border bg-muted/30 px-3 py-1 divide-y">
                                <DetailRow
                                    label="Phone"
                                    value={editTarget.phone}
                                />
                                {isAdmin && (
                                    <DetailRow
                                        label="Agent"
                                        value={editTarget.organization?.name}
                                    />
                                )}
                                <DetailRow
                                    label="Location"
                                    value={editTarget.location}
                                />
                                <DetailRow
                                    label="Home type"
                                    value={editTarget.homeType}
                                />
                                <DetailRow
                                    label="Bedrooms"
                                    value={editTarget.bedrooms}
                                />
                                <DetailRow
                                    label="Bathrooms"
                                    value={editTarget.bathrooms}
                                />
                                <DetailRow
                                    label="Budget"
                                    value={editTarget.budget}
                                />
                                <DetailRow
                                    label="Matches shown"
                                    value={
                                        editTarget.matchCount != null
                                            ? String(editTarget.matchCount)
                                            : null
                                    }
                                />
                                <DetailRow
                                    label="Consent"
                                    value={editTarget.consent ? "Yes" : "No"}
                                />
                                <DetailRow
                                    label="Submitted"
                                    value={formatDate(editTarget.createdAt)}
                                />
                            </div>

                            <form
                                onSubmit={editForm.handleSubmit(onEdit)}
                                className="flex flex-col gap-4"
                                noValidate
                            >
                                <FieldGroup className="gap-4">
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
                                                    onValueChange={
                                                        field.onChange
                                                    }
                                                >
                                                    <SelectTrigger id="edit-status">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {LEAD_STATUSES.map(
                                                            (s) => (
                                                                <SelectItem
                                                                    key={s}
                                                                    value={s}
                                                                >
                                                                    {
                                                                        LEAD_STATUS_LABELS[
                                                                            s
                                                                        ]
                                                                    }
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                    </Field>

                                    <Field
                                        data-invalid={
                                            editErrors.note ? true : undefined
                                        }
                                    >
                                        <FieldLabel htmlFor="edit-note">
                                            Note
                                        </FieldLabel>
                                        <Textarea
                                            id="edit-note"
                                            rows={4}
                                            placeholder="Follow-up notes, context, next steps…"
                                            aria-invalid={
                                                editErrors.note ? true : undefined
                                            }
                                            {...editForm.register("note")}
                                        />
                                        {editErrors.note && (
                                            <FieldError
                                                errors={[
                                                    {
                                                        message:
                                                            editErrors.note
                                                                .message,
                                                    },
                                                ]}
                                            />
                                        )}
                                    </Field>
                                </FieldGroup>
                            </form>
                        </div>
                    )}

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
