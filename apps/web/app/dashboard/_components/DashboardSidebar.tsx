"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Building2,
    MapPinned,
    Map,
    LayoutTemplate,
    Plus,
} from "lucide-react";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from "@workspace/ui/components/sidebar";

type NavItem = {
    title: string;
    href: string;
    icon: React.ComponentType;
};

const overview: NavItem[] = [
    { title: "Overview", href: "/dashboard", icon: LayoutDashboard },
];

const content: NavItem[] = [
    { title: "Communities", href: "/dashboard/communities", icon: Building2 },
    { title: "Regions", href: "/dashboard/regions", icon: Map },
    { title: "Counties", href: "/dashboard/counties", icon: MapPinned },
    {
        title: "Floor Plans",
        href: "/dashboard/floor-plans",
        icon: LayoutTemplate,
    },
];

export function DashboardSidebar() {
    const pathname = usePathname();

    const isActive = (href: string) =>
        href === "/dashboard"
            ? pathname === href
            : pathname === href || pathname.startsWith(`${href}/`);

    return (
        <Sidebar>
            <SidebarHeader>
                <div className="flex items-center gap-2 px-2 py-1.5">
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <Building2 className="size-4" />
                    </div>
                    <div className="flex flex-col leading-none">
                        <span className="font-semibold text-sm">
                            National House Search
                        </span>
                        <span className="text-xs text-muted-foreground">
                            Admin Dashboard
                        </span>
                    </div>
                </div>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {overview.map((item) => (
                                <SidebarMenuItem key={item.href}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={isActive(item.href)}
                                    >
                                        <Link href={item.href}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarGroup>
                    <SidebarGroupLabel>Content</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {content.map((item) => (
                                <SidebarMenuItem key={item.href}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={isActive(item.href)}
                                    >
                                        <Link href={item.href}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            isActive={isActive("/dashboard/communities/new")}
                        >
                            <Link href="/dashboard/communities/new">
                                <Plus />
                                <span>Add Community</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>

            <SidebarRail />
        </Sidebar>
    );
}
