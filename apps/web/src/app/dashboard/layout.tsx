'use client';
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import Header from "./_components/header";
import { AppSidebar } from "./_components/app-sidebar/app-sidebar";
import { ChatDrawer } from "@/components/chat/chat-drawer";
import { usePathname } from "next/navigation";

const CAMPAIGN_ID_RE =
  /^\/dashboard\/campaigns\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const campaignMatch = pathname.match(CAMPAIGN_ID_RE);
  // Campaign context for the drawer's sidebar chip + scoped session creation.
  // Derived from the route (matching existing IA) rather than a prop drilled
  // through every page.
  const campaignId = campaignMatch?.[1];

  return (
    <main>
      <TooltipProvider>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            {/* Header */}
            <Header />
            {/* Main Content */}
            <main className="flex flex-1 flex-col gap-4 p-4 pt-0">
              {children}
            </main>
          </SidebarInset>
          <ChatDrawer campaignId={campaignId} />
        </SidebarProvider>
      </TooltipProvider>
    </main>
  );
}
