
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
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/features/auth/hooks";
import { signOutUserAction } from "@/features/auth/actions";

type UserMenuItemType = {
  title: string;
  href: string;
  icon: React.ReactNode;
};

const userMenuItems: UserMenuItemType[] = [
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
  collapsed: boolean;
  notificationCount?: number;
  onRequestSidebarExpand?: () => void;
}

export function UserMenu({
  collapsed,
  notificationCount = 0, // Default to 0 if not provided
  onRequestSidebarExpand,
}: UserMenuProps) {
  const [expanded, setExpanded] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const {
    user, // Raw Supabase user
    profile, // Detailed UserProfile (initially from hydrated data)
    isLoadingAuth, // Composite loading: true if session loading OR (session exists AND profile loading)
    // isSessionLoading, // Use this for very initial UI if needed, but isLoadingAuth is more comprehensive
  } = useAuth();

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
    if (collapsed) {
      setExpanded(false);
    }
  }, [collapsed]);

  const toggleExpanded = () => {
    if (collapsed) {
      onRequestSidebarExpand?.();
      return;
    }
    setExpanded(!expanded);
  };

  const getDisplayName = () => {
    if (profile?.firstName) return profile.firstName;
    const userMetaFirstName = user?.user_metadata?.first_name as string | undefined;
    if (userMetaFirstName) return userMetaFirstName;
    if (user?.email) return user.email.split('@')[0];
    return "User";
  };

  const getEmailDisplay = () => {
    return profile?.email || user?.email || "No email available";
  };
  
  const getInitials = () => {
    const first = profile?.firstName?.[0] || (user?.user_metadata?.first_name as string)?.[0] || '';
    const last = profile?.lastName?.[0] || (user?.user_metadata?.last_name as string)?.[0] || '';
    const initials = `${first}${last}`.toUpperCase();
    return initials || <UserCircle2 size={18} />;
  };

  const avatarUrl = profile?.avatarUrl || (user?.user_metadata?.avatar_url as string | undefined);

  return (
    <div className="mt-auto border-t p-4 relative" ref={menuRef}>
      <div
        className={cn(
          "flex items-center gap-3 cursor-pointer",
          collapsed && "justify-center"
        )}
        onClick={toggleExpanded}
        role="button"
        aria-expanded={expanded}
        aria-label={collapsed ? "Expand sidebar and open user menu" : (expanded ? "Collapse user menu" : "Expand user menu")}
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleExpanded();}}
      >
        {isLoadingAuth ? (
          <Skeleton className="h-9 w-9 rounded-full" />
        ) : (
          <div className="relative">
            <Avatar className="h-9 w-9 text-sm">
              <AvatarImage src={avatarUrl || undefined} alt={getDisplayName()} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            {notificationCount > 0 && !collapsed && (
              <span className={cn(
                "absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground",
                expanded && "opacity-0" // Hide badge when menu items are expanded
              )}>
                {notificationCount}
              </span>
            )}
          </div>
        )}
        {!collapsed && (
          <>
            <div className="flex-1 overflow-hidden">
              {isLoadingAuth ? (
                <>
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-3 w-32" />
                </>
              ) : (
                <>
                  <div className="font-medium truncate">{getDisplayName()}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {getEmailDisplay()}
                  </div>
                </>
              )}
            </div>
            {!isLoadingAuth && ( // Only show chevron if not loading
                 <span className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md">
                    {expanded ? <ChevronsDownUp className="h-4 w-4" /> : <ChevronsUpDown className="h-4 w-4" />}
                </span>
            )}
          </>
        )}
         {collapsed && isLoadingAuth && ( // Show a small loader if sidebar collapsed and still loading
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      <AnimatePresence>
        {!collapsed && expanded && !isLoadingAuth && ( // Overlay only if sidebar not collapsed, menu expanded, and not loading auth
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
                  onClick={() => setExpanded(false)}
                >
                  {item.icon}
                  <span>{item.title}</span>
                </Link>
              ))}
              <Separator className="my-1" />
              <form action={signOutUserAction} className="w-full">
                <button
                  type="submit"
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10 justify-start"
                  )}
                  onClick={() => setExpanded(false)} // Close overlay on click before submitting
                >
                  <LogOut className="h-5 w-5" />
                  <span>Log out</span>
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
