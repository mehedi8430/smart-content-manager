import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import Header from "./_components/header";
import { AppSidebar } from "./_components/app-sidebar/app-sidebar";
import { ChatDrawer } from "@/components/chat/chat-drawer";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
          {/* Chat Drawer */}
          {/* <ChatDrawer /> */}
        </SidebarProvider>
      </TooltipProvider>
    </main>
  );
}
