"use client";

import { useSelectedLayoutSegment } from "next/navigation";
import { Menu, MoreHorizontal, UserCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth/hooks";

const getPageTitle = (segment: string | null): string => {
  if (!segment) return "Dashboard";
  // Convert kebab-case to Title Case
  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

interface DashboardHeaderProps {
  onToggleMobileSidebar: () => void;
  isMobileSidebarOpen: boolean; // To manage aria-expanded or similar if needed
}

export function DashboardHeader({ onToggleMobileSidebar }: DashboardHeaderProps) {
  const segment = useSelectedLayoutSegment();
  const pageTitle = getPageTitle(segment);

  const { user, profile, isLoadingAuth, isSessionLoading } = useAuth();

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
        {isSessionLoading || isLoadingAuth ? (
          <Skeleton className="h-8 w-8 rounded-full" />
        ) : user ? (
          <Avatar className="h-8 w-8 text-sm">
            <AvatarImage src={avatarUrl || undefined} alt={getDisplayName()} />
            <AvatarFallback className="bg-muted text-muted-foreground text-xs">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
        ) : null}
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
