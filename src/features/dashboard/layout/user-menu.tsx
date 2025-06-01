// src/features/dashboard/layout/user-menu.tsx
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
  User as UserIcon 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/features/auth/hooks";
import { signOutUserAction } from "@/features/auth/actions";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction as AlertDialogConfirm // Renamed for clarity
} from "@/components/ui/alert-dialog"; // Assuming AlertDialogAction is the confirm action
import { Button } from "@/components/ui/button";


type UserMenuItemType = {
  title: string;
  href: string;
  icon: React.ReactNode;
};

// Updated User Menu Items to include Profile
const userMenuItems: UserMenuItemType[] = [
  {
    title: "Profile",
    href: "/dashboard/profile", // Corrected path
    icon: <UserIcon className="h-5 w-5" />,
  },
  {
    title: "Settings",
    href: "/settings", // This might need to be /dashboard/settings later
    icon: <Settings className="h-5 w-5" />,
  },
  {
    title: "Documentation",
    href: "/docs", // Assuming global docs
    icon: <FileText className="h-5 w-5" />,
  },
  {
    title: "Support",
    href: "/support", // Assuming global support
    icon: <Headphones className="h-5 w-5" />,
  },
];

interface UserMenuProps {
  collapsed: boolean;
  notificationCount?: number;
  onRequestSidebarExpand?: () => void;
}
const getTimestampLog = () => new Date().toISOString();

export function UserMenu({
  collapsed,
  notificationCount = 0,
  onRequestSidebarExpand,
}: UserMenuProps) {
  const [mounted, setMounted] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const {
    user, 
    profile, 
    isLoadingAuth,
    isSessionLoading,
    isProfileLoading,
  } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) && expanded) {
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
  
  const getInitials = (baseUser = user, baseProfile = profile) => {
    const first = baseProfile?.firstName || (baseUser?.user_metadata?.first_name as string)?.[0] || '';
    const last = baseProfile?.lastName || (baseUser?.user_metadata?.last_name as string)?.[0] || '';
    const initials = `${first}${last}`.toUpperCase();
    return initials || <UserCircle2 size={18} />;
  };

  const avatarUrl = profile?.avatarUrl || (user?.user_metadata?.avatar_url as string | undefined);
  
  const isLoadingCoreData = !mounted || isSessionLoading || (user && isProfileLoading && !profile);


  return (
    <>
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
          {/* Avatar Section */}
          <div className="relative">
           {isLoadingCoreData ? (
             <Skeleton className="h-9 w-9 rounded-full" />
           ) : user ? (
            <Avatar className="h-9 w-9 text-sm">
                {avatarUrl && <AvatarImage src={avatarUrl} alt={getDisplayName()} />}
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {getInitials()}
                </AvatarFallback>
            </Avatar>
           ) : (
            <Avatar className="h-9 w-9 text-sm">
                <AvatarFallback className="bg-muted text-muted-foreground">
                    <UserCircle2 size={18} />
                </AvatarFallback>
            </Avatar>
           )}
            {notificationCount > 0 && !collapsed && !isLoadingCoreData && user && (
              <span className={cn(
                "absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground",
                expanded && "opacity-0" 
              )}>
                {notificationCount}
              </span>
            )}
          </div>

          {/* Name and Email Section (Not collapsed) */}
          {!collapsed && (
            <>
              <div className="flex-1 overflow-hidden">
                {isLoadingCoreData ? (
                  <>
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-3 w-32" />
                  </>
                ) : user ? (
                  <>
                    <div className="font-medium truncate">{getDisplayName()}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {getEmailDisplay()}
                    </div>
                  </>
                ) : (
                  <div className="font-medium truncate text-muted-foreground">Not Logged In</div>
                )}
              </div>
              <span className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md">
                {isLoadingCoreData ? <Loader2 className="h-4 w-4 animate-spin" /> : 
                  (expanded ? <ChevronsDownUp className="h-4 w-4" /> : <ChevronsUpDown className="h-4 w-4" />)
                }
              </span>
            </>
          )}
        </div>

        {/* Expanded Menu Items (Not collapsed and not loading core data) */}
        <AnimatePresence>
          {!collapsed && expanded && !isLoadingCoreData && user && ( 
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
                    onClick={() => setExpanded(false)} // Close popover on item click
                  >
                    {item.icon}
                    <span>{item.title}</span>
                  </Link>
                ))}
                <Separator className="my-1" />
                {/* Log out button triggers the dialog */}
                <button
                  type="button"
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10 justify-start"
                  )}
                  onClick={() => {
                    setExpanded(false); // Close the popover
                    setShowLogoutConfirm(true); // Open the confirmation dialog
                  }}
                >
                  <LogOut className="h-5 w-5" />
                  <span>Log out</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to log out of your account?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowLogoutConfirm(false)}>
              Cancel
            </AlertDialogCancel>
            <form action={signOutUserAction}>
              <Button
                type="submit"
                variant="destructive"
                onClick={() => {
                  setShowLogoutConfirm(false); 
                }}
              >
                Log Out
              </Button>
            </form>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
