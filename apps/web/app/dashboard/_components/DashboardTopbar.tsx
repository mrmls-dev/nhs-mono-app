"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Settings } from "lucide-react";
import { toast } from "sonner";
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@workspace/ui/components/avatar";
import { Badge } from "@workspace/ui/components/badge";
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
import { useSession, signOut, isPlatformAdmin } from "@/lib/auth-client";

export function DashboardTopbar() {
    const router = useRouter();
    const { data: session } = useSession();
    const user = session?.user;
    const isAdmin = isPlatformAdmin(user);

    const name = user?.name ?? "";
    const initials = name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

    const handleLogout = async () => {
        await signOut();
        toast.success("Signed out.");
        router.push("/login");
        router.refresh();
    };

    return (
        <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mr-2 h-6" />

            <div className="flex-1" />

            <Badge variant="secondary" className="hidden sm:inline-flex">
                {isAdmin ? "Platform Admin" : "Agent"}
            </Badge>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        className="h-9 gap-2 px-1.5"
                        aria-label="Open user menu"
                    >
                        <Avatar className="size-7">
                            <AvatarImage src={user?.image ?? ""} alt={name} />
                            <AvatarFallback>{initials || "?"}</AvatarFallback>
                        </Avatar>
                        <span className="hidden text-sm font-medium sm:inline">
                            {name}
                        </span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium">{name}</span>
                            <span className="text-xs font-normal text-muted-foreground">
                                {user?.email}
                            </span>
                        </div>
                    </DropdownMenuLabel>
                    {!isAdmin && (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuGroup>
                                <DropdownMenuItem asChild>
                                    <Link href="/dashboard/settings">
                                        <Settings />
                                        Settings
                                    </Link>
                                </DropdownMenuItem>
                            </DropdownMenuGroup>
                        </>
                    )}
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
