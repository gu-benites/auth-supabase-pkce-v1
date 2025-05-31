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
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/features/auth/hooks";
import { signOutUserAction } from "@/features/auth/actions";

// Type for NavItem, assuming it's defined elsewhere or we define a simplified one here
type UserMenuItem = {
  title: string;
  href: string;
  icon: React.ReactNode;
};

const userMenuItems: UserMenuItem[] = [
  {
    title: "Documentation",
    href: "/docs", // Assuming a future docs page
    icon: <FileText className="h-5 w-5" />,
  },
  {
    title: "Support",
    href: "/support", // Assuming a future support page
    icon: <Headphones className="h-5 w-5" />,
  },
  {
    title: "Settings",
    href: "/settings", // Assuming a future settings page
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
  notificationCount = 1, // Default, can be made dynamic later
  onUserMenuClick,
}: UserMenuProps) {
  const [expanded, setExpanded] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const {
    user,
    profile,
    isLoadingAuth, // Composite loading: session OR (session + profile)
    isSessionLoading, // Use this for the initial "Am I logged in?" check
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
      onUserMenuClick?.();
      return;
    }
    setExpanded(!expanded);
    onExpand?.(!expanded);
  };

  const getDisplayName = () => {
    if (profile?.firstName) return profile.firstName;
    const userMetaFirstName = user?.user_metadata?.first_name as string | undefined;
    if (userMetaFirstName) return userMetaFirstName;
    if (user?.email) return user.email.split("@")[0];
    return "User";
  };

  const getInitials = () => {
    const firstName = profile?.firstName || (user?.user_metadata?.first_name as string | undefined);
    const lastName = profile?.lastName || (user?.user_metadata?.last_name as string | undefined);
    const firstInitial = firstName?.[0] || "";
    const lastInitial = lastName?.[0] || "";
    const initials = `${firstInitial}${lastInitial}`.toUpperCase();
    return initials || <UserCircle2 size={18} />;
  };

  const avatarUrl = profile?.avatarUrl || (user?.user_metadata?.avatar_url as string | undefined);

  if (isSessionLoading || isLoadingAuth) {
    return (
      <div className="mt-auto border-t p-4">
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <Skeleton className="h-9 w-9 rounded-full" />
          {!collapsed && (
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-24" />
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!user) {
    // User not authenticated, perhaps show a login prompt or nothing
    return null; // Or a login button if appropriate for the context
  }

  return (
    <div className="mt-auto border-t p-4" ref={menuRef}>
      <div
        className={cn("flex items-center gap-3 cursor-pointer", collapsed && "justify-center")}
        onClick={toggleExpanded}
      >
        <div className="relative">
          <Avatar className="h-9 w-9 text-sm">
            <AvatarImage src={avatarUrl || undefined} alt={getDisplayName()} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {getInitials()}
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
              <div className="font-medium truncate">{getDisplayName()}</div>
              <div className="truncate text-xs text-muted-foreground">
                {user.email}
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
          <form action={signOutUserAction} className="w-full">
            <Button
                variant="ghost"
                type="submit"
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10 w-full justify-start"
                onClick={() => setExpanded(false)}
            >
                <LogOut className="h-5 w-5" />
                <span>Log out</span>
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
