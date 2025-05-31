"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Home,
  KanbanSquare,
  LayoutGrid,
  LogOut,
  Mail,
  Menu,
  MessageSquare,
  Search,
  Settings,
  Target,
  Headphones,
  FileText,
  PanelLeftClose,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

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

interface SidebarProps {
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
    title: "Search",
    href: "/search",
    icon: <Search className="h-5 w-5" />,
  },
  {
    title: "Chat",
    href: "/chat",
    icon: <MessageSquare className="h-5 w-5" />,
    badge: 3, // Example badge count
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

const userMenuItems: NavItem[] = [
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

function UserMenu({ 
  collapsed, 
  onExpand, 
  notificationCount = 1,
  onUserMenuClick 
}: { 
  collapsed: boolean; 
  onExpand?: (expanded: boolean) => void;
  notificationCount?: number;
  onUserMenuClick?: () => void;
}) {
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
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
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

  return (
    <div className="mt-auto border-t p-4" ref={menuRef}>
      <div 
        className={cn(
          "flex items-center gap-3 cursor-pointer",
          collapsed && "justify-center"
        )}
        onClick={toggleExpanded}
      >
        <div className="relative">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
            <span className="text-sm font-medium">AT</span>
          </div>
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
            {notificationCount}
          </span>
        </div>
        {!collapsed && (
          <>
            <div className="flex-1 overflow-hidden">
              <div className="font-medium">Anna Taylor</div>
              <div className="truncate text-xs text-muted-foreground">
                anna.t@email.com
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-accent hover:text-accent-foreground"
            >
              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
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
          <Link
            href="/logout"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
            onClick={() => setExpanded(false)}
          >
            <LogOut className="h-5 w-5" />
            <span>Log out</span>
          </Link>
        </div>
      )}
    </div>
  );
}

function MenuItem({ 
  item, 
  collapsed, 
  isSubmenuOpen, 
  onSubmenuToggle 
}: { 
  item: NavItem; 
  collapsed: boolean;
  isSubmenuOpen?: boolean;
  onSubmenuToggle?: () => void;
}) {
  const pathname = usePathname();
  // Normalize paths to handle trailing slashes
  const normalizedPath = pathname.replace(/\/$/, '');
  const normalizedHref = item.href.replace(/\/$/, '');
  
  // Only mark as active if it's an exact match or a direct child path
  const isActive = 
    normalizedPath === normalizedHref || 
    (normalizedPath.startsWith(`${normalizedHref}/`) && 
     !normalizedPath.replace(normalizedHref, '').includes('/'));

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
            : "hover:bg-accent hover:text-accent-foreground",
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
              <ChevronRight className={cn(
                "ml-2 h-4 w-4 transition-transform duration-200",
                isSubmenuOpen && "rotate-90"
              )} />
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
        <div className="ml-6 mt-1 space-y-1 border-l-2 border-accent pl-4 animate-in slide-in-from-left-5">
          {item.submenu.map((subItem) => (
            <Link
              key={subItem.href}
              href={subItem.href}
              className={cn(
                "flex items-center rounded-md px-3 py-2 text-sm transition-colors",
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

export function Sidebar({ onClose, collapsed = false, onUserMenuClick }: SidebarProps) {
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (collapsed) {
      setOpenSubmenus({});
    }
  }, [collapsed]);

  const toggleSubmenu = (title: string) => {
    if (collapsed) return;
    setOpenSubmenus(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  if (loading) {
    return (
      <div className="w-64 h-screen border-r bg-background p-4">
        <div className="space-y-4">
          <Skeleton className="h-8 w-full" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
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
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
              <div className="h-4 w-4 rounded-sm bg-primary" />
            </div>
            <span>Beyond UI</span>
          </Link>
        )}
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 hover:bg-accent hover:text-accent-foreground transition-colors"
            aria-label={collapsed ? "Open sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <Menu className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
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

      <UserMenu 
        collapsed={collapsed} 
        onExpand={(expanded) => {
          if (expanded && collapsed) {
            onUserMenuClick?.();
          }
        }}
        onUserMenuClick={onUserMenuClick}
      />
    </aside>
  );
}