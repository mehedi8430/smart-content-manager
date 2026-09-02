"use client";

import React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/providers/theme-provider";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { NavUser } from "./app-sidebar/nav-user";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { CampaignSearch } from "@/app/dashboard/_components/campaign-search";

export default function Header() {
  const { setTheme } = useTheme();
  const pathname = usePathname();

  const getBreadcrumbs = () => {
    const segments = pathname.split("/").filter(Boolean);
    const breadcrumbs = [];

    if (segments.length === 0) {
      return [{ label: "Dashboard", href: "/dashboard", isLast: true }];
    }

    breadcrumbs.push({
      label: "Dashboard",
      href: "/dashboard",
      isLast: segments.length === 1 && segments[0] === "dashboard",
    });

    let accumulatedPath = "";

    for (let i = 1; i < segments.length; i++) {
      const isUuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          segments[i],
        );

      if (isUuid) {
        accumulatedPath += `/dashboard/${segments[i]}`;
        continue;
      }

      accumulatedPath += `/dashboard/${segments[i]}`;

      breadcrumbs.push({
        label: segments[i].charAt(0).toUpperCase() + segments[i].slice(1),
        href: accumulatedPath,
        isLast: i === segments.length - 1,
      });
    }

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex w-full items-center justify-between gap-3">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-vertical:h-4 data-vertical:self-auto"
          />

          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbs.map((crumb) => (
                <React.Fragment key={crumb.href}>
                  <BreadcrumbItem className="hidden md:block">
                    {crumb.isLast ? (
                      <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                    ) : (
                      <Link href={crumb.href}>{crumb.label}</Link>
                    )}
                  </BreadcrumbItem>
                  {!crumb.isLast && (
                    <BreadcrumbSeparator
                      key={`${crumb.href}-sep`}
                      className="hidden md:block"
                    />
                  )}
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="mr-4 flex items-center gap-2">
          <CampaignSearch />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="cursor-pointer">
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

          <NavUser />
        </div>
      </div>
    </header>
  );
}
