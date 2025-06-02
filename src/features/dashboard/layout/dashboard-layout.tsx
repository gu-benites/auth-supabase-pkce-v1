// src/features/dashboard/layout/dashboard-layout.tsx
"use client";

import { ReactNode, useState, useEffect, useCallback } from "react";
import { DashboardSidebar, DashboardHeader } from "../components"; // Updated import path
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const checkMobile = useCallback(() => {
    const isMobileView = window.innerWidth <= 768;
    setIsMobile(isMobileView);
    setSidebarOpen(!isMobileView);
  }, []);


  useEffect(() => {
    setMounted(true);
    checkMobile();
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
  
  const handleSidebarClose = () => {
    setSidebarOpen((prev) => !prev);
  };


  if (!mounted) {
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
          isMobile ? "w-64" : (sidebarOpen ? "w-64" : "w-16")
        )}
      >
        <DashboardSidebar
          onClose={handleSidebarClose}
          collapsed={!sidebarOpen && !isMobile}
          onUserMenuClick={isMobile ? () => setSidebarOpen(true) : undefined}
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
