"use client";

import { TriangleAlert } from "lucide-react";
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogMedia,
    AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog";

type ErrorDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    message: string;
};

export function ErrorDialog({ open, onOpenChange, message }: ErrorDialogProps) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogMedia>
                        <TriangleAlert className="text-destructive" />
                    </AlertDialogMedia>
                    <AlertDialogTitle>Something went wrong</AlertDialogTitle>
                    <AlertDialogDescription>{message}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>OK</AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
