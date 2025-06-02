// src/features/dashboard/components/dashboard-sidebar.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CheckCircle,
  ChevronRight,
  Home,
  KanbanSquare,
  LayoutGrid,
  Mail,
  Menu,
  MessageSquare,
  Search,
  Target,
  PanelLeftClose,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardUserMenu } from "./dashboard-user-menu"; // Updated import

type SubMenuItem = {
  title: string;
  href: string;
};

type NavItem = {
  title: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
  submenu?: SubMenuItem[];
};

interface DashboardSidebarProps {
  onClose?: () => void; 
  collapsed?: boolean;
  onUserMenuClick?: () => void;
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: <Home className="h-5 w-5" />,
  },
  {
    title: "Profile", 
    href: "/dashboard/profile",
    icon: <User className="h-5 w-5" />,
  },
  {
    title: "Search",
    href: "/search",
    icon: <Search className="h-5 w-5" />,
  },
  {
    title: "Chat",
    href: "/dashboard/chat",
    icon: <MessageSquare className="h-5 w-5" />,
    badge: 3, 
  },
  {
    title: "Reporting",
    href: "/reporting",
    icon: <BarChart3 className="h-5 w-5" />,
    submenu: [
      { title: "Analytics", href: "/reporting/analytics" },
      { title: "Performance", href: "/reporting/performance" },
      { title: "Metrics", href: "/reporting/metrics" },
    ],
  },
  {
    title: "Check-ins",
    href: "/check-ins",
    icon: <CheckCircle className="h-5 w-5" />,
  },
  {
    title: "Objectives",
    href: "/objectives",
    icon: <Target className="h-5 w-5" />,
  },
  {
    title: "Career Hub",
    href: "/career-hub",
    icon: <LayoutGrid className="h-5 w-5" />,
  },
  {
    title: "Mail",
    href: "/mail",
    icon: <Mail className="h-5 w-5" />,
    submenu: [
      { title: "Inbox", href: "/mail/inbox" },
      { title: "Sent", href: "/mail/sent" },
      { title: "Drafts", href: "/mail/drafts" },
    ],
  },
  {
    title: "Kanban",
    href: "/kanban",
    icon: <KanbanSquare className="h-5 w-5" />,
  },
  {
    title: "Tasks",
    href: "/tasks",
    icon: <CheckCircle className="h-5 w-5" />,
    badge: 3,
  },
];

function MenuItem({
  item,
  collapsed,
  isSubmenuOpen,
  onSubmenuToggle,
}: {
  item: NavItem;
  collapsed: boolean;
  isSubmenuOpen?: boolean;
  onSubmenuToggle?: () => void;
}) {
  const pathname = usePathname();
  const normalizedPath = pathname.replace(/\/$/, "");
  const normalizedHref = item.href.replace(/\/$/, "");

  const isActive =
    normalizedPath === normalizedHref ||
    (normalizedPath.startsWith(`${normalizedHref}/`) &&
      !normalizedPath.replace(normalizedHref, "").includes("/"));

  return (
    <>
      <Link
        href={item.submenu && !collapsed ? "#" : item.href}
        onClick={(e) => {
          if (item.submenu && !collapsed) {
            e.preventDefault();
            onSubmenuToggle?.();
          }
        }}
        className={cn(
          "flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors relative group",
          isActive
            ? "bg-accent text-accent-foreground"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
          collapsed && "justify-center px-2",
          item.submenu && !collapsed && "cursor-pointer"
        )}
      >
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          {item.icon}
          {!collapsed && <span>{item.title}</span>}
        </div>
        {!collapsed && (
          <div className="flex items-center">
            {item.badge && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                {item.badge}
              </span>
            )}
            {item.submenu && (
              <ChevronRight
                className={cn(
                  "ml-2 h-4 w-4 transition-transform duration-200",
                  isSubmenuOpen && "rotate-90"
                )}
              />
            )}
          </div>
        )}
        {collapsed && item.badge && (
          <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
            {item.badge}
          </div>
        )}
      </Link>
      {item.submenu && isSubmenuOpen && !collapsed && (
        <div className="ml-6 mt-1 space-y-1 border-l-2 border-border pl-4 animate-in slide-in-from-left-3">
          {item.submenu.map((subItem) => (
            <Link
              key={subItem.href}
              href={subItem.href}
              className={cn(
                "flex items-center rounded-md px-3 py-2 text-sm transition-colors text-muted-foreground",
                pathname === subItem.href
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent hover:text-accent-foreground"
              )}
            >
              {subItem.title}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

export function DashboardSidebar({ onClose, collapsed = false, onUserMenuClick }: DashboardSidebarProps) {
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (collapsed) {
      setOpenSubmenus({});
    }
  }, [collapsed]);

  const toggleSubmenu = (title: string) => {
    if (collapsed) return;
    setOpenSubmenus((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  if (loading && !collapsed) {
    return (
      <div className={cn("flex h-screen flex-col border-r bg-background transition-all duration-300", collapsed ? "w-16" : "w-64", "p-4")}>
        <div className="flex h-14 items-center justify-between border-b px-0 mb-2">
          {!collapsed && <Skeleton className="h-8 w-32" />}
           <Skeleton className="h-8 w-8" />
        </div>
        <div className="flex-1 space-y-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
        <Skeleton className="h-20 w-full mt-auto" />
      </div>
    );
  }

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r bg-background transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-14 items-center justify-between border-b px-4">
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2 font-semibold group">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
              <div className="h-4 w-4 rounded-sm bg-primary group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-foreground group-hover:text-primary transition-colors">PassForge</span>
          </Link>
        )}
        <div className={cn("flex gap-1", collapsed && "w-full justify-center")}>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose} 
            className="h-8 w-8 hover:bg-accent hover:text-accent-foreground transition-colors"
            aria-label={collapsed ? "Open sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <Menu className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.title}>
              <MenuItem
                item={item}
                collapsed={collapsed}
                isSubmenuOpen={openSubmenus[item.title]}
                onSubmenuToggle={() => toggleSubmenu(item.title)}
              />
            </li>
          ))}
        </ul>
      </nav>

      <DashboardUserMenu
        collapsed={collapsed}
        onRequestSidebarExpand={onUserMenuClick} 
        notificationCount={1}
      />
    </aside>
  );
}
