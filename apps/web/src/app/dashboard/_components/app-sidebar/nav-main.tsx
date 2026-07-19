"use client";

import {
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { LayoutDashboard, FileText, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { listCampaignsAction } from "@/actions/campaign.action";
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
    {
      title: "Recent Campaigns",
      icon: FileText,
      hasSubmenu: true,
    },
  ],
};

export function NavMain() {
  const pathname = usePathname();
  const [isCampaignsOpen, setIsCampaignsOpen] = useState(true);
  const [recentCampaigns, setRecentCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    const fetchRecentCampaigns = async () => {
      try {
        const result = await listCampaignsAction({
          limit: 10,
          sortBy: "createdAt",
          sortOrder: "desc",
        });
        if (result.data && result.data.data) {
          setRecentCampaigns(result.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch recent campaigns:", error);
      }
    };

    fetchRecentCampaigns();
  }, []);

  return (
    <SidebarContent>
      <SidebarGroup>
        <SidebarMenu className="gap-2">
          {data.navMain.map((item) => (
            <SidebarMenuItem key={item.title}>
              {item.hasSubmenu ? (
                <>
                  <SidebarMenuButton
                    onClick={() => setIsCampaignsOpen(!isCampaignsOpen)}
                    className={` ${
                      pathname === item.url ? "bg-sidebar-accent" : ""
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                    <ChevronRight
                      className={`ml-auto h-4 w-4 transition-transform ${
                        isCampaignsOpen ? "rotate-90" : ""
                      }`}
                    />
                  </SidebarMenuButton>
                  {isCampaignsOpen && (
                    <SidebarMenuSub className="border-l-2 border-accent">
                      {recentCampaigns.map((campaign) => (
                        <SidebarMenuSubItem key={campaign.id}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={pathname.startsWith(
                              `/dashboard/campaigns/${campaign.id}`,
                            )}
                            className="truncate"
                          >
                            <Link
                              href={`/dashboard/campaigns/${campaign.id}/board`}
                            >
                              {campaign.name}
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  )}
                </>
              ) : (
                <SidebarMenuButton
                  asChild
                  className={` ${
                    pathname === item.url ? "bg-sidebar-accent" : ""
                  }`}
                >
                  <Link
                    href={item?.url || "/dashboard"}
                    className="font-medium"
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroup>
    </SidebarContent>
  );
}
