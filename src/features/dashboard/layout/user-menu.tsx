
"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LogOut,
  Settings,
  Headphones,
  FileText,
  UserCircle2,
  ChevronsUpDown,
  ChevronsDownUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
// Button import removed as we'll use a styled span for the icon
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type UserMenuItem = {
  title: string;
  href: string;
  icon: React.ReactNode;
};

const userMenuItems: UserMenuItem[] = [
  {
    title: "Documentation",
    href: "/docs",
    icon: <FileText className="h-5 w-5" />,
  },
  {
    title: "Support",
    href: "/support",
    icon: <Headphones className="h-5 w-5" />,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: <Settings className="h-5 w-5" />,
  },
];

interface UserMenuProps {
  collapsed: boolean; // True if the parent sidebar is in icon-only mode
  notificationCount?: number;
  onRequestSidebarExpand?: () => void; // Called when user clicks menu when sidebar is collapsed
}

export function UserMenu({
  collapsed,
  notificationCount = 1,
  onRequestSidebarExpand,
}: UserMenuProps) {
  const [expanded, setExpanded] = useState(false); // For the user menu items overlay
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setExpanded(false);
      }
    };
    if (expanded) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [expanded]);

  useEffect(() => {
    // If sidebar collapses, ensure user menu items are also collapsed
    if (collapsed) {
      setExpanded(false);
    }
  }, [collapsed]);

  const toggleExpanded = () => {
    if (collapsed) {
      // If the sidebar is icon-only, this click should request the sidebar to expand
      onRequestSidebarExpand?.();
      return; // Do not toggle menu items yet
    }
    // If sidebar is full-width, toggle the menu items overlay
    setExpanded(!expanded);
  };

  // Static placeholder data (as per previous step to remove dynamic calls)
  const displayName = "Demo User";
  const email = "demo@example.com";
  const initials = "DU";
  const avatarUrl = undefined;

  return (
    <div className="mt-auto border-t p-4 relative" ref={menuRef}>
      <div
        className={cn(
          "flex items-center gap-3 cursor-pointer",
          collapsed && "justify-center" // Center avatar when sidebar is collapsed
        )}
        onClick={toggleExpanded}
        role="button"
        aria-expanded={expanded}
        aria-label={collapsed ? "Expand sidebar and open user menu" : (expanded ? "Collapse user menu" : "Expand user menu")}
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleExpanded();}}
      >
        <div className="relative">
          <Avatar className="h-9 w-9 text-sm">
            <AvatarImage src={avatarUrl || undefined} alt={displayName} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {initials || <UserCircle2 size={18} />}
            </AvatarFallback>
          </Avatar>
          {/* Badge only makes sense if menu can expand, so only if !collapsed */}
          {notificationCount > 0 && !collapsed && (
            <span className={cn(
              "absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground",
               // Hide badge when menu items are expanded to avoid overlap with overlay
              expanded && "opacity-0"
            )}>
              {notificationCount}
            </span>
          )}
        </div>
        {!collapsed && (
          <>
            <div className="flex-1 overflow-hidden">
              <div className="font-medium truncate">{displayName}</div>
              <div className="truncate text-xs text-muted-foreground">
                {email}
              </div>
            </div>
            <span className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md">
              {expanded ? <ChevronsDownUp className="h-4 w-4" /> : <ChevronsUpDown className="h-4 w-4" />}
            </span>
          </>
        )}
      </div>

      <AnimatePresence>
        {!collapsed && expanded && ( // Overlay only shows if sidebar is not collapsed AND menu is expanded
          <motion.div
            initial={{ opacity: 0, y: 10, scale:0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale:0.95, transition: { duration: 0.15 } }}
            transition={{ type: "spring", stiffness: 400, damping: 25, duration: 0.2 }}
            className="absolute bottom-full left-2 right-2 mb-2 z-20 bg-popover text-popover-foreground border border-border rounded-md shadow-xl p-2"
          >
            <div className="space-y-1">
              {userMenuItems.map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                    pathname === item.href
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent hover:text-accent-foreground"
                  )}
                  onClick={() => setExpanded(false)} // Close overlay on item click
                >
                  {item.icon}
                  <span>{item.title}</span>
                </Link>
              ))}
              <Separator className="my-1" />
              <Link
                href="/login" // Placeholder, actual logout form/action would be used
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10 justify-start"
                onClick={() => setExpanded(false)}
              >
                <LogOut className="h-5 w-5" />
                <span>Log out (Placeholder)</span>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
