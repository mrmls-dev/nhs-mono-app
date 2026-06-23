"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Building2,
    MapPinned,
    Map,
    Plus,
    Users,
    UserCog,
    Palette,
    Globe,
    Search,
    CalendarClock,
    Settings,
    PhoneCall,
    Plug,
} from "lucide-react";
import { AgentDetailSidebar } from "../agents/[id]/_components/AgentDetailSidebar";
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
import { useSession, isPlatformAdmin } from "@/lib/auth-client";

type NavItem = {
    title: string;
    href: string;
    icon: React.ComponentType;
};

type NavGroup = {
    label?: string;
    items: NavItem[];
};

const overviewItem: NavItem = {
    title: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
};

const adminGroups: NavGroup[] = [
    { items: [overviewItem] },
    {
        label: "Catalog",
        items: [
            { title: "Regions", href: "/dashboard/regions", icon: Map },
            { title: "Counties", href: "/dashboard/counties", icon: MapPinned },
            { title: "Communities", href: "/dashboard/communities", icon: Building2 },
        ],
    },
    {
        label: "Agents",
        items: [
            { title: "Agents", href: "/dashboard/agents", icon: Users },
            { title: "New Agent", href: "/dashboard/new-agent", icon: Plus },
        ],
    },
    {
        label: "Platform",
        items: [
            { title: "Contacts", href: "/dashboard/contacts", icon: PhoneCall },
            { title: "Members", href: "/dashboard/members", icon: UserCog },
            {
                title: "Integrations",
                href: "/dashboard/integrations",
                icon: Plug,
            },
        ],
    },
];

const agentGroups: NavGroup[] = [
    { items: [overviewItem] },
    {
        label: "Your site",
        items: [
            { title: "Communities", href: "/dashboard/listings", icon: Building2 },
            { title: "Branding", href: "/dashboard/branding", icon: Palette },
            { title: "SEO", href: "/dashboard/seo", icon: Search },
            { title: "Domain", href: "/dashboard/domain", icon: Globe },
            {
                title: "Schedule Embed",
                href: "/dashboard/schedule-embed",
                icon: CalendarClock,
            },
            { title: "Settings", href: "/dashboard/settings", icon: Settings },
        ],
    },
];

/** Matches `/dashboard/agents/<id>...` (a specific agent), not the list. The
 *  create form lives at `/dashboard/new-agent`, so it isn't matched here. */
const isAgentDetailPath = (pathname: string) =>
    /^\/dashboard\/agents\/[^/]+/.test(pathname);

export function DashboardSidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const isAdmin = isPlatformAdmin(session?.user);

    // Admins managing a single agent get a contextual sidebar (back +
    // agent switcher + per-agent sections) in place of the main nav.
    if (isAdmin && isAgentDetailPath(pathname)) {
        return <AgentDetailSidebar />;
    }

    const groups = isAdmin ? adminGroups : agentGroups;

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
                            {isAdmin ? "Admin Dashboard" : "Agent Dashboard"}
                        </span>
                    </div>
                </div>
            </SidebarHeader>

            <SidebarContent>
                {groups.map((group, i) => (
                    <SidebarGroup key={group.label ?? `group-${i}`}>
                        {group.label && (
                            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
                        )}
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {group.items.map((item) => (
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
                ))}
            </SidebarContent>

            {isAdmin && (
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
            )}

            <SidebarRail />
        </Sidebar>
    );
}
