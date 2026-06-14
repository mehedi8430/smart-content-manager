"use client";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/providers/theme-provider";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";

export default function DashboardPage() {
  const { setTheme } = useTheme();

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-vertical:h-4 data-vertical:self-auto"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Dashboard</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}>
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-muted-foreground">
                Welcome to your Smart Content and Campaign Manager dashboard
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border bg-card text-card-foreground shadow">
                <div className="p-6">
                  <div className="text-2xl font-bold">12</div>
                  <div className="text-xs text-muted-foreground">
                    Active Campaigns
                  </div>
                </div>
              </div>
              <div className="rounded-xl border bg-card text-card-foreground shadow">
                <div className="p-6">
                  <div className="text-2xl font-bold">48</div>
                  <div className="text-xs text-muted-foreground">
                    Content Pieces
                  </div>
                </div>
              </div>
              <div className="rounded-xl border bg-card text-card-foreground shadow">
                <div className="p-6">
                  <div className="text-2xl font-bold">2.4k</div>
                  <div className="text-xs text-muted-foreground">
                    Total Views
                  </div>
                </div>
              </div>
              <div className="rounded-xl border bg-card text-card-foreground shadow">
                <div className="p-6">
                  <div className="text-2xl font-bold">89%</div>
                  <div className="text-xs text-muted-foreground">
                    Engagement Rate
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border bg-card text-card-foreground shadow">
              <div className="p-6">
                <h2 className="text-lg font-semibold">Recent Activity</h2>
                <p className="text-sm text-muted-foreground mt-2">
                  Your recent campaigns and content updates will appear here.
                </p>
              </div>
            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
