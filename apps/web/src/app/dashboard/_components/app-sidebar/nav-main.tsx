"use client";

import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { LayoutDashboard, FileText } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Campaign } from "@/types/campaign.type";

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Campaigns",
      url: "/dashboard/campaigns",
      icon: FileText,
    },
  ],
};

export function NavMain({ recentCampaigns }: { recentCampaigns: Campaign[] }) {
  const pathname = usePathname();

  return (
    <SidebarContent>
      <SidebarGroup>
        <SidebarMenu className="gap-2">
          {data.navMain.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                className={pathname === item.url ? "bg-sidebar-accent" : ""}
              >
                <Link href={item.url} className="font-medium">
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroup>

      {recentCampaigns.length > 0 && (
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel>Recents</SidebarGroupLabel>
          <SidebarMenu>
            {recentCampaigns.map((campaign) => (
              <SidebarMenuItem key={campaign.id}>
                <SidebarMenuButton
                  asChild
                  size="sm"
                  isActive={pathname.startsWith(
                    `/dashboard/campaigns/${campaign.id}`,
                  )}
                >
                  <Link href={`/dashboard/campaigns/${campaign.id}/board`}>
                    <span>{campaign.name}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      )}
    </SidebarContent>
  );
}
