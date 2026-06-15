"use client";

import { useState } from "react";
import { Loader2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogMedia,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@workspace/ui/components/alert-dialog";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { deleteAgent, type Agent } from "@/api/agent";

type DeleteAgentDialogProps = {
    agent: Pick<Agent, "id" | "name">;
    /** Trigger element — rendered via AlertDialogTrigger asChild. */
    children: React.ReactNode;
    /** Called after a successful delete (e.g. to navigate away). */
    onDeleted?: () => void;
};

/**
 * Type-to-confirm deletion dialog. The agent's name must be typed exactly
 * before the destructive action enables — guarding against deleting the wrong
 * agent. Deleting removes the org, its members/invitations, the owner's login,
 * and any custom domain.
 */
export function DeleteAgentDialog({
    agent,
    children,
    onDeleted,
}: DeleteAgentDialogProps) {
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);
    const [confirmText, setConfirmText] = useState("");

    const mutation = useMutation({
        mutationFn: () => deleteAgent(agent.id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["agents"] });
            toast.success(`${agent.name} deleted.`);
            setOpen(false);
            onDeleted?.();
        },
        onError: (err: Error) => toast.error(err.message),
    });

    const canDelete = confirmText.trim() === agent.name && !mutation.isPending;

    const onOpenChange = (next: boolean) => {
        if (mutation.isPending) return; // don't close mid-flight
        setOpen(next);
        if (!next) setConfirmText("");
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogMedia className="bg-destructive/10 text-destructive">
                        <TriangleAlert />
                    </AlertDialogMedia>
                    <AlertDialogTitle>Delete {agent.name}?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This permanently deletes the agent and{" "}
                        <span className="font-medium text-foreground">
                            everything tied to it
                        </span>
                        : their organization, owner login, custom domain, and
                        site access. This cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="flex flex-col gap-2">
                    <Label htmlFor="confirm-agent-name">
                        Type{" "}
                        <span className="font-mono font-medium text-foreground">
                            {agent.name}
                        </span>{" "}
                        to confirm
                    </Label>
                    <Input
                        id="confirm-agent-name"
                        value={confirmText}
                        autoComplete="off"
                        autoFocus
                        disabled={mutation.isPending}
                        onChange={(e) => setConfirmText(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && canDelete) {
                                e.preventDefault();
                                mutation.mutate();
                            }
                        }}
                    />
                </div>

                <AlertDialogFooter>
                    <AlertDialogCancel disabled={mutation.isPending}>
                        Cancel
                    </AlertDialogCancel>
                    <Button
                        variant="destructive"
                        disabled={!canDelete}
                        onClick={() => mutation.mutate()}
                    >
                        {mutation.isPending && (
                            <Loader2 data-icon="inline-start" className="animate-spin" />
                        )}
                        Delete agent
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
