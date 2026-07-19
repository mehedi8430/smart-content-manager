"use client";

import * as React from "react";

import { NavMain } from "@/app/dashboard/_components/app-sidebar/nav-main";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Command, MessagesSquare } from "lucide-react";
import { useOpenChat } from "@/hooks/use-open-chat";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { openGeneral } = useOpenChat();

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    Smart Content Manager
                  </span>
                  <span className="truncate text-xs">Enterprise</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Sidebar menu content */}
      <SidebarContent>
        <NavMain />
        <SidebarMenu className="gap-2 px-2 pb-2">
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={openGeneral}
              className="cursor-pointer"
              tooltip="Chat"
            >
              <MessagesSquare className="h-4 w-4" />
              <span>Chat</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
