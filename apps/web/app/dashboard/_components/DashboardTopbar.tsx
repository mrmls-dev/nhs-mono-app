"use client";

import { LogOut, User, Settings } from "lucide-react";
import { toast } from "sonner";
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@workspace/ui/components/avatar";
import { Button } from "@workspace/ui/components/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Separator } from "@workspace/ui/components/separator";
import { SidebarTrigger } from "@workspace/ui/components/sidebar";

export function DashboardTopbar() {
    // Placeholder user — wire to real auth (Better Auth) later.
    const user = {
        name: "Simon Karim",
        email: "admin@nationalhousesearch.com",
        avatar: "",
    };

    const initials = user.name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

    const handleLogout = () => {
        // Placeholder — replace with real sign-out once auth is wired.
        toast.success("Signed out (placeholder).");
    };

    return (
        <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mr-2 h-6" />

            <div className="flex-1" />

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        className="h-9 gap-2 px-1.5"
                        aria-label="Open user menu"
                    >
                        <Avatar className="size-7">
                            <AvatarImage src={user.avatar} alt={user.name} />
                            <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        <span className="hidden text-sm font-medium sm:inline">
                            {user.name}
                        </span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium">
                                {user.name}
                            </span>
                            <span className="text-xs font-normal text-muted-foreground">
                                {user.email}
                            </span>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                        <DropdownMenuItem>
                            <User />
                            Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <Settings />
                            Settings
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onClick={handleLogout}>
                        <LogOut />
                        Log out
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </header>
    );
}
