"use client";

import { ReactNode, useState, useEffect } from "react";
import { Sidebar } from "./sidebar";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { Menu, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSelectedLayoutSegment } from "next/navigation";

interface DashboardLayoutProps {
  children: ReactNode;
}

const getPageTitle = (segment: string | null): string => {
  if (!segment) return 'Dashboard';
  
  // Convert kebab-case to Title Case
  return segment
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const segment = useSelectedLayoutSegment();
  const pageTitle = getPageTitle(segment);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => {
      const isMobileView = window.innerWidth <= 768;
      setIsMobile(isMobileView);
      setSidebarOpen(!isMobileView);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && sidebarOpen && isMobile) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [sidebarOpen, isMobile]);

  if (!mounted) {
    return null;
  }

  const handleUserMenuClick = () => {
    if (isMobile) {
      setSidebarOpen(true);
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Backdrop for mobile */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <div 
        className={cn(
          "fixed inset-y-0 z-50 md:relative transition-transform duration-300 ease-in-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          isMobile ? "w-64" : "w-auto"
        )}
      >
        <Sidebar 
          onClose={() => setSidebarOpen(!sidebarOpen)}
          collapsed={!sidebarOpen && !isMobile}
          onUserMenuClick={handleUserMenuClick}
        />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-between border-b px-4 md:px-6">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "md:hidden",
                "hover:bg-accent hover:text-accent-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              )}
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle sidebar"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle sidebar</span>
            </Button>
            <h1 className="text-xl font-semibold">{pageTitle}</h1>
          </div>
          <div className="flex items-center gap-2">
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
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}