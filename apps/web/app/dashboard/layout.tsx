import {
    SidebarInset,
    SidebarProvider,
} from "@workspace/ui/components/sidebar";
import { DashboardSidebar } from "./_components/DashboardSidebar";
import { DashboardTopbar } from "./_components/DashboardTopbar";

export default function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <SidebarProvider>
            <DashboardSidebar />
            <SidebarInset>
                <DashboardTopbar />
                <main className="flex-1 p-4 md:p-6">{children}</main>
            </SidebarInset>
        </SidebarProvider>
    );
}
