
"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  ChevronUp,
  LogOut,
  Settings,
  Headphones,
  FileText,
  UserCircle2,
  // Loader2, // No longer needed for auth loading here
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { Skeleton } from "@/components/ui/skeleton"; // No longer needed for auth loading
// import { useAuth } from "@/features/auth/hooks"; // Removed
// import { signOutUserAction } from "@/features/auth/actions"; // Removed

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
  collapsed: boolean;
  onExpand?: (expanded: boolean) => void;
  notificationCount?: number;
  onUserMenuClick?: () => void;
}

export function UserMenu({
  collapsed,
  onExpand,
  notificationCount = 1,
  onUserMenuClick,
}: UserMenuProps) {
  const [expanded, setExpanded] = useState(false);
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
    if (collapsed) {
      setExpanded(false);
    }
  }, [collapsed]);

  const toggleExpanded = () => {
    if (collapsed) {
      onUserMenuClick?.();
      return;
    }
    setExpanded(!expanded);
    onExpand?.(!expanded);
  };

  // Static placeholder data
  const displayName = "Demo User";
  const email = "demo@example.com";
  const initials = "DU";
  const avatarUrl = undefined; // Or a placeholder image URL

  return (
    <div className="mt-auto border-t p-4" ref={menuRef}>
      <div
        className={cn("flex items-center gap-3 cursor-pointer", collapsed && "justify-center")}
        onClick={toggleExpanded}
      >
        <div className="relative">
          <Avatar className="h-9 w-9 text-sm">
            <AvatarImage src={avatarUrl || undefined} alt={displayName} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {initials || <UserCircle2 size={18} />}
            </AvatarFallback>
          </Avatar>
          {notificationCount > 0 && !collapsed && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
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
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent hover:text-accent-foreground">
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </>
        )}
      </div>

      {!collapsed && expanded && (
        <div className="mt-4 space-y-1 animate-in slide-in-from-bottom-5">
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
          <Separator className="my-2" />
          {/* Placeholder for logout or link to login */}
          <Button
              variant="ghost"
              asChild
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10 w-full justify-start"
              onClick={() => setExpanded(false)}
          >
            <Link href="/login"> 
              <LogOut className="h-5 w-5" />
              <span>Log out (Placeholder)</span>
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
