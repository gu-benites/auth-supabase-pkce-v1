"use client";

import { ReactNode, useState, useEffect, useCallback } from "react";
import { DashboardSidebar, DashboardHeader } from "../layout"; // Updated import path
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true); // Default to open on desktop
  const [isMobile, setIsMobile] = useState(false);

  const checkMobile = useCallback(() => {
    const isMobileView = window.innerWidth <= 768;
    setIsMobile(isMobileView);
    // If switching from mobile to desktop, ensure sidebar is open
    // If switching from desktop to mobile, close sidebar by default
    setSidebarOpen(!isMobileView);
  }, []);


  useEffect(() => {
    setMounted(true);
    checkMobile(); // Initial check
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [checkMobile]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && sidebarOpen && isMobile) {
        setSidebarOpen(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [sidebarOpen, isMobile]);

  const toggleMobileSidebar = () => {
    if (isMobile) {
      setSidebarOpen((prev) => !prev);
    }
  };
  
  const handleSidebarClose = () => { // Renamed from onUserMenuClick for clarity
    setSidebarOpen((prev) => !prev);
  };


  if (!mounted) {
    // To prevent hydration mismatch and layout shifts, consider a skeleton or null until mounted
    // For simplicity here, returning null but a proper skeleton would be better.
    return null; 
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
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
          isMobile ? "w-64" : (sidebarOpen ? "w-64" : "w-16") // Adjust width for collapsed desktop
        )}
      >
        <DashboardSidebar
          onClose={handleSidebarClose} // This toggles sidebar open/close
          collapsed={!sidebarOpen && !isMobile}
          onUserMenuClick={isMobile ? () => setSidebarOpen(true) : undefined} // For UserMenu interaction on mobile
        />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader
          onToggleMobileSidebar={toggleMobileSidebar}
          isMobileSidebarOpen={isMobile && sidebarOpen}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
