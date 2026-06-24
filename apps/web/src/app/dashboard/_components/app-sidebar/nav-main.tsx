"use client";

import {
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { LayoutDashboard, FileText } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

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

export function NavMain() {
  const pathname = usePathname();

  return (
    <SidebarContent>
      <SidebarGroup>
        <SidebarMenu className="gap-2">
          {data.navMain.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                className={`hover:bg-sidebar-primary/90 hover:text-sidebar-primary-foreground ${
                  pathname === item.url
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : ""
                }`}
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
    </SidebarContent>
  );
}
