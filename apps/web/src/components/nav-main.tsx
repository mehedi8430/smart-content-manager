"use client";

import {
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  FileText,
  Calendar,
  BarChart3,
  Users,
  Settings,
} from "lucide-react";

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Campaigns",
      url: "/campaigns",
      icon: FileText,
    },
    {
      title: "Calendar",
      url: "/calendar",
      icon: Calendar,
    },
    {
      title: "Analytics",
      url: "/analytics",
      icon: BarChart3,
    },
    {
      title: "Team",
      url: "/team",
      icon: Users,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings,
    },
  ],
};

export function NavMain() {
  return (
    <SidebarContent>
      <SidebarGroup>
        <SidebarMenu className="gap-2">
          {data.navMain.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <a href={item.url} className="font-medium">
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroup>
    </SidebarContent>
  );
}
