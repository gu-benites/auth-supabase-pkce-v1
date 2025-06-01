
"use client";

import { useSelectedLayoutSegment } from "next/navigation";
import { Menu, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { cn } from "@/lib/utils";

const getPageTitle = (segment: string | null): string => {
  if (!segment) return "Dashboard"; // Fallback for the root of the (dashboard) group or if segment is 'dashboard'
  if (segment === 'dashboard') return "Dashboard"; // Explicitly handle 'dashboard' segment
  // Convert kebab-case or simple segment to Title Case
  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

interface DashboardHeaderProps {
  onToggleMobileSidebar: () => void;
  isMobileSidebarOpen: boolean; // This prop is available if needed for other logic
}

export function DashboardHeader({ onToggleMobileSidebar }: DashboardHeaderProps) {
  const segment = useSelectedLayoutSegment();
  const pageTitle = getPageTitle(segment);

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
