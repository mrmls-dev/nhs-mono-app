"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { ArrowLeft, IdCard, Palette, Search, Globe } from "lucide-react";
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from "@workspace/ui/components/sidebar";
import { Button } from "@workspace/ui/components/button";
import { AgentSwitcher } from "./AgentSwitcher";

const sections = [
    { slug: "details", title: "Agent details", icon: IdCard },
    { slug: "branding", title: "Branding", icon: Palette },
    { slug: "seo", title: "SEO", icon: Search },
    { slug: "domain", title: "Domain", icon: Globe },
] as const;

export function AgentDetailSidebar() {
    const params = useParams<{ id: string }>();
    const pathname = usePathname();
    const base = `/dashboard/agents/${params.id}`;

    return (
        <Sidebar>
            <SidebarHeader className="gap-2">
                <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-muted-foreground"
                >
                    <Link href="/dashboard/agents">
                        <ArrowLeft />
                        All agents
                    </Link>
                </Button>
                <AgentSwitcher />
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Manage</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {sections.map((s) => {
                                const href = `${base}/${s.slug}`;
                                return (
                                    <SidebarMenuItem key={s.slug}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={pathname === href}
                                        >
                                            <Link href={href}>
                                                <s.icon />
                                                <span>{s.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarRail />
        </Sidebar>
    );
}
