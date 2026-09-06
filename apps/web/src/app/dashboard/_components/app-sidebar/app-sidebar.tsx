"use client";

import * as React from "react";

import { NavMain } from "@/app/dashboard/_components/app-sidebar/nav-main";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Command, MessagesSquare } from "lucide-react";
import { useOpenChat } from "@/hooks/use-open-chat";
import { Campaign } from "@/types/campaign.type";
import { OnboardingHint } from "@/components/onboarding-hint";

export function AppSidebar({
  recentCampaigns,
  ...props
}: React.ComponentProps<typeof Sidebar> & { recentCampaigns: Campaign[] }) {
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
        {/* Main Nav */}
        <NavMain recentCampaigns={recentCampaigns} />
      </SidebarContent>
      <SidebarFooter>
        {/* Chat Button */}
        <SidebarMenu>
          <SidebarMenuItem>
            <OnboardingHint
              id="chat-assistant"
              message="Open the AI assistant anytime to brainstorm or get help with your content."
              side="top"
              align="start"
              className="block w-full min-w-0"
            >
              <SidebarMenuButton
                onClick={openGeneral}
                className="cursor-pointer bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                tooltip="Chat"
              >
                <MessagesSquare className="h-4 w-4" />
                <span>Chat</span>
              </SidebarMenuButton>
            </OnboardingHint>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
