import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import Header from "./_components/header";
import { AppSidebar } from "./_components/app-sidebar/app-sidebar";
import { ChatDrawer } from "@/app/dashboard/_components/chat/chat-drawer";
import { listCampaignsAction } from "@/actions/campaign.action";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const result = await listCampaignsAction({
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const recentCampaigns = result.data?.data ?? [];

  return (
    <main>
      <TooltipProvider>
        <SidebarProvider>
          <AppSidebar recentCampaigns={recentCampaigns} />
          <SidebarInset>
            {/* Header */}
            <Header />
            {/* Main Content */}
            <main className="flex flex-1 flex-col gap-4 p-4 pt-0">
              {children}
            </main>
          </SidebarInset>
          {/* Chat Drawer */}
          <ChatDrawer />
        </SidebarProvider>
      </TooltipProvider>
    </main>
  );
}
