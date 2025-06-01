
"use client";

import { usePathname } from "next/navigation"; // Changed from useSelectedLayoutSegment
import { Menu, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { cn } from "@/lib/utils";

// Updated function to derive title from the full pathname
const getPageTitleFromPathname = (pathname: string | null): string => {
  if (!pathname) return "Dashboard"; // Should not happen in practice with usePathname

  // Handle the base /dashboard route
  if (pathname === "/dashboard" || pathname === "/dashboard/") {
    return "Dashboard";
  }

  // Remove the leading /dashboard/ prefix
  const pathSegments = pathname.startsWith('/dashboard/') ? pathname.substring('/dashboard/'.length).split('/') : pathname.replace(/^\//, '').split('/');
  
  if (pathSegments.length > 0 && pathSegments[0]) {
    const mainSegment = pathSegments[0];
    // Convert kebab-case or simple segment to Title Case
    return mainSegment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  return "Dashboard"; // Fallback
};

interface DashboardHeaderProps {
  onToggleMobileSidebar: () => void;
  isMobileSidebarOpen: boolean; 
}

export function DashboardHeader({ onToggleMobileSidebar }: DashboardHeaderProps) {
  const pathname = usePathname(); // Use usePathname
  const pageTitle = getPageTitleFromPathname(pathname); // Use updated title logic

  return (
    <header className="flex h-14 items-center justify-between border-b px-4 md:px-6 sticky top-0 bg-background/95 backdrop-blur-sm z-10">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "md:hidden",
            "hover:bg-accent hover:text-accent-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          )}
          onClick={onToggleMobileSidebar}
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>
        <h1 className="text-xl font-semibold">{pageTitle}</h1>
      </div>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label="More options"
        >
          <MoreHorizontal className="h-5 w-5" />
          <span className="sr-only">More options</span>
        </Button>
      </div>
    </header>
  );
}
