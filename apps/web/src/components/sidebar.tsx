"use client"

import * as React from "react"
import {
  LayoutDashboard,
  Settings,
  Users,
  FileText,
  Calendar,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Menu,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"

const sidebarItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    title: "Campaigns",
    icon: FileText,
    href: "/campaigns",
  },
  {
    title: "Calendar",
    icon: Calendar,
    href: "/calendar",
  },
  {
    title: "Analytics",
    icon: BarChart3,
    href: "/analytics",
  },
  {
    title: "Team",
    icon: Users,
    href: "/team",
  },
  {
    title: "Settings",
    icon: Settings,
    href: "/settings",
  },
]

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  isCollapsed?: boolean
  onCollapse?: () => void
}

export function Sidebar({
  className,
  isCollapsed = false,
  onCollapse,
}: SidebarProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false)

  const SidebarContent = (
    <div className={cn("flex h-full flex-col", className)}>
      <div className="flex h-14 items-center border-b px-4">
        <div className="flex items-center gap-2 font-semibold">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <LayoutDashboard className="h-5 w-5" />
          </div>
          {!isCollapsed && <span className="text-lg">SCCM</span>}
        </div>
        {!isCollapsed && (
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto h-8 w-8"
            onClick={onCollapse}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
      </div>
      <ScrollArea className="flex-1 px-2 py-4">
        <nav className="space-y-1">
          {sidebarItems.map((item) => (
            <Button
              key={item.href}
              variant={isCollapsed ? "ghost" : "ghost"}
              size={isCollapsed ? "icon" : "default"}
              className={cn(
                "w-full justify-start",
                isCollapsed ? "h-9 w-9" : "h-10 px-3"
              )}
              asChild
            >
              <a href={item.href}>
                <item.icon className="h-5 w-5" />
                {!isCollapsed && <span className="ml-2">{item.title}</span>}
              </a>
            </Button>
          ))}
        </nav>
      </ScrollArea>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden border-r bg-sidebar md:block",
          isCollapsed ? "w-16" : "w-64",
          className
        )}
      >
        {SidebarContent}
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          {SidebarContent}
        </SheetContent>
      </Sheet>
    </>
  )
}

export function SidebarCollapseButton({
  isCollapsed,
  onCollapse,
}: {
  isCollapsed: boolean
  onCollapse: () => void
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="hidden md:flex"
      onClick={onCollapse}
    >
      {isCollapsed ? (
        <ChevronRight className="h-4 w-4" />
      ) : (
        <ChevronLeft className="h-4 w-4" />
      )}
    </Button>
  )
}
