"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, UserCog, Loader2, Eye, EyeOff, SquarePen, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import { cn } from "@workspace/ui/lib/utils";
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
import { Input } from "@workspace/ui/components/input";
import {
    Empty,
    EmptyContent,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
    EmptyDescription,
} from "@workspace/ui/components/empty";
import { Skeleton } from "@workspace/ui/components/skeleton";
import {
    getStaff,
    createStaff,
    updateStaff,
    deleteStaff,
    type StaffMember,
} from "@/api/staff";
import { useSession } from "@/lib/auth-client";
import { DeleteDialog } from "@/components/DeleteDialog";

const profileFields = {
    name: z.string().min(1, "Name is required"),
    email: z.string().min(1, "Email is required").email("Enter a valid email"),
};
const createSchema = z.object({
    ...profileFields,
    password: z.string().min(8, "At least 8 characters"),
});
const editSchema = z.object(profileFields);

type CreateFormValues = z.infer<typeof createSchema>;
type EditFormValues = z.infer<typeof editSchema>;

const dateFmt = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
});

function RoleBadge({ role }: { role: StaffMember["role"] }) {
    const isOwner = role === "owner";
    return (
        <Badge
            variant="outline"
            className={cn(
                isOwner
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "text-muted-foreground",
            )}
        >
            {isOwner ? "Owner" : "Admin"}
        </Badge>
    );
}

export function MembersClient() {
    const { data: session } = useSession();
    const currentUserId = session?.user?.id;
    const qc = useQueryClient();

    const [createOpen, setCreateOpen] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [editTarget, setEditTarget] = useState<StaffMember | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<StaffMember | null>(null);

    const {
        data: members,
        isPending,
        isError,
    } = useQuery<StaffMember[]>({
        queryKey: ["staff"],
        queryFn: getStaff,
    });

    const createForm = useForm<CreateFormValues>({
        resolver: zodResolver(createSchema),
        defaultValues: { name: "", email: "", password: "" },
    });

    const editForm = useForm<EditFormValues>({
        resolver: zodResolver(editSchema),
        defaultValues: { name: "", email: "" },
    });

    // Load the selected member into the edit form whenever the sheet opens.
    useEffect(() => {
        if (editTarget) {
            editForm.reset({
                name: editTarget.name,
                email: editTarget.email,
            });
        }
    }, [editTarget, editForm]);

    const createMutation = useMutation({
        mutationFn: createStaff,
        onSuccess: (created) => {
            qc.invalidateQueries({ queryKey: ["staff"] });
            toast.success(`${created.name} added as a member.`);
            handleCreateOpenChange(false);
        },
        onError: (err: Error) => toast.error(err.message),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, input }: { id: string; input: EditFormValues }) =>
            updateStaff(id, input),
        onSuccess: (updated) => {
            qc.invalidateQueries({ queryKey: ["staff"] });
            toast.success(`${updated.name} updated.`);
            setEditTarget(null);
        },
        onError: (err: Error) => toast.error(err.message),
    });

    const deleteMutation = useMutation({
        mutationFn: deleteStaff,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["staff"] });
            toast.success("Member removed.");
            setDeleteTarget(null);
        },
        onError: (err: Error) => {
            setDeleteTarget(null);
            toast.error(err.message);
        },
    });

    const handleCreateOpenChange = (next: boolean) => {
        if (!next) {
            createForm.reset();
            setShowPassword(false);
        }
        setCreateOpen(next);
    };

    const onCreate = (values: CreateFormValues) =>
        createMutation.mutate(values);
    const onEdit = (values: EditFormValues) => {
        if (editTarget) updateMutation.mutate({ id: editTarget.id, input: values });
    };

    const createErrors = createForm.formState.errors;
    const editErrors = editForm.formState.errors;

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Members
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Team members with access to the admin dashboard.
                    </p>
                </div>
                <Button onClick={() => setCreateOpen(true)}>
                    <Plus data-icon="inline-start" />
                    Add Member
                </Button>
            </div>

            {isPending ? (
                <div className="flex flex-col gap-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full rounded-lg" />
                    ))}
                </div>
            ) : isError ? (
                <p className="text-sm text-destructive">
                    Could not load members. Make sure the API is running.
                </p>
            ) : members && members.length > 0 ? (
                <div className="overflow-hidden rounded-lg border">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-muted/50 text-left text-muted-foreground">
                                <th className="px-4 py-3 font-medium">Name</th>
                                <th className="px-4 py-3 font-medium">Email</th>
                                <th className="px-4 py-3 font-medium">Role</th>
                                <th className="px-4 py-3 font-medium hidden sm:table-cell">
                                    Added
                                </th>
                                <th className="px-4 py-3 font-medium text-right">
                                    <span className="sr-only">Actions</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {members.map((m, i) => {
                                const canDelete =
                                    m.role !== "owner" &&
                                    m.id !== currentUserId;
                                return (
                                    <tr
                                        key={m.id}
                                        className={
                                            i < members.length - 1
                                                ? "border-b"
                                                : ""
                                        }
                                    >
                                        <td className="px-4 py-3 font-medium">
                                            {m.name}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {m.email}
                                        </td>
                                        <td className="px-4 py-3">
                                            <RoleBadge role={m.role} />
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                                            {dateFmt.format(
                                                new Date(m.createdAt),
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    aria-label={`Edit ${m.name}`}
                                                    className="text-muted-foreground hover:text-foreground"
                                                    onClick={() =>
                                                        setEditTarget(m)
                                                    }
                                                >
                                                    <SquarePen />
                                                </Button>
                                                {canDelete && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon-sm"
                                                        aria-label={`Delete ${m.name}`}
                                                        className="text-muted-foreground hover:text-destructive"
                                                        onClick={() =>
                                                            setDeleteTarget(m)
                                                        }
                                                    >
                                                        <Trash2 />
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <Empty className="border border-dashed">
                    <EmptyHeader>
                        <EmptyMedia variant="icon">
                            <UserCog />
                        </EmptyMedia>
                        <EmptyTitle>No members yet</EmptyTitle>
                        <EmptyDescription>
                            Add a team member to give them access to the admin
                            dashboard.
                        </EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent>
                        <Button onClick={() => setCreateOpen(true)}>
                            <Plus data-icon="inline-start" />
                            Add Member
                        </Button>
                    </EmptyContent>
                </Empty>
            )}

            {/* Add Member sheet */}
            <Sheet open={createOpen} onOpenChange={handleCreateOpenChange}>
                <SheetContent side="right" className="overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>Add Member</SheetTitle>
                        <SheetDescription>
                            Create a login for a team member. They can sign in
                            immediately with the email and password you set.
                        </SheetDescription>
                    </SheetHeader>

                    <form
                        onSubmit={createForm.handleSubmit(onCreate)}
                        className="flex flex-col gap-4 px-4"
                        noValidate
                    >
                        <FieldGroup className="gap-4">
                            <Field
                                data-invalid={
                                    createErrors.name ? true : undefined
                                }
                            >
                                <FieldLabel htmlFor="create-name">
                                    Name
                                </FieldLabel>
                                <Input
                                    id="create-name"
                                    placeholder="Jordan Reyes"
                                    aria-invalid={
                                        createErrors.name ? true : undefined
                                    }
                                    {...createForm.register("name")}
                                />
                                {createErrors.name && (
                                    <FieldError
                                        errors={[
                                            { message: createErrors.name.message },
                                        ]}
                                    />
                                )}
                            </Field>

                            <Field
                                data-invalid={
                                    createErrors.email ? true : undefined
                                }
                            >
                                <FieldLabel htmlFor="create-email">
                                    Email
                                </FieldLabel>
                                <Input
                                    id="create-email"
                                    type="email"
                                    placeholder="jordan@nationalhousesearch.com"
                                    aria-invalid={
                                        createErrors.email ? true : undefined
                                    }
                                    {...createForm.register("email")}
                                />
                                {createErrors.email && (
                                    <FieldError
                                        errors={[
                                            {
                                                message:
                                                    createErrors.email.message,
                                            },
                                        ]}
                                    />
                                )}
                            </Field>

                            <Field
                                data-invalid={
                                    createErrors.password ? true : undefined
                                }
                            >
                                <FieldLabel htmlFor="create-password">
                                    Initial password
                                </FieldLabel>
                                <div className="relative">
                                    <Input
                                        id="create-password"
                                        type={
                                            showPassword ? "text" : "password"
                                        }
                                        placeholder="At least 8 characters"
                                        className="pr-10"
                                        aria-invalid={
                                            createErrors.password
                                                ? true
                                                : undefined
                                        }
                                        {...createForm.register("password")}
                                    />
                                    <button
                                        type="button"
                                        tabIndex={-1}
                                        aria-label={
                                            showPassword
                                                ? "Hide password"
                                                : "Show password"
                                        }
                                        onClick={() =>
                                            setShowPassword((v) => !v)
                                        }
                                        className="absolute inset-y-0 right-3 flex items-center text-muted-foreground"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="size-4" />
                                        ) : (
                                            <Eye className="size-4" />
                                        )}
                                    </button>
                                </div>
                                <FieldDescription>
                                    Share these credentials with the member; they
                                    can change the password after signing in.
                                </FieldDescription>
                                {createErrors.password && (
                                    <FieldError
                                        errors={[
                                            {
                                                message:
                                                    createErrors.password
                                                        .message,
                                            },
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
                            onClick={() => handleCreateOpenChange(false)}
                            disabled={createMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={createMutation.isPending}
                            onClick={createForm.handleSubmit(onCreate)}
                        >
                            {createMutation.isPending && (
                                <Loader2
                                    data-icon="inline-start"
                                    className="animate-spin"
                                />
                            )}
                            Add Member
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            {/* Edit Member sheet */}
            <Sheet
                open={editTarget !== null}
                onOpenChange={(open) => {
                    if (!open) setEditTarget(null);
                }}
            >
                <SheetContent side="right" className="overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>Edit Member</SheetTitle>
                        <SheetDescription>
                            Update the member&rsquo;s name and email. Passwords
                            are managed by the member after signing in.
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
                                    editErrors.name ? true : undefined
                                }
                            >
                                <FieldLabel htmlFor="edit-name">Name</FieldLabel>
                                <Input
                                    id="edit-name"
                                    aria-invalid={
                                        editErrors.name ? true : undefined
                                    }
                                    {...editForm.register("name")}
                                />
                                {editErrors.name && (
                                    <FieldError
                                        errors={[
                                            { message: editErrors.name.message },
                                        ]}
                                    />
                                )}
                            </Field>

                            <Field
                                data-invalid={
                                    editErrors.email ? true : undefined
                                }
                            >
                                <FieldLabel htmlFor="edit-email">
                                    Email
                                </FieldLabel>
                                <Input
                                    id="edit-email"
                                    type="email"
                                    aria-invalid={
                                        editErrors.email ? true : undefined
                                    }
                                    {...editForm.register("email")}
                                />
                                {editErrors.email && (
                                    <FieldError
                                        errors={[
                                            { message: editErrors.email.message },
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

            {/* Delete confirmation */}
            <DeleteDialog
                open={deleteTarget !== null}
                onOpenChange={(open) => {
                    if (!open) setDeleteTarget(null);
                }}
                itemName={deleteTarget?.name ?? ""}
                isPending={deleteMutation.isPending}
                onConfirm={() => {
                    if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
                }}
            />
        </div>
    );
}
