
# Dashboard Feature (`src/features/dashboard`)

## Overview

The Dashboard feature provides the main user interface and navigational structure for authenticated users. It encompasses the primary layout, including a sidebar, header, and content area where various application modules and data are presented.

This README explains the current dashboard structure, how to add new pages/features to the dashboard, and how to access user information within dashboard components.

## Core Architecture

The dashboard is built around a few key components that work together:

1.  **Route Group Layout (`src/app/(dashboard)/layout.tsx`):**
    *   This Next.js App Router layout file applies the `DashboardLayout` component to all routes within the `(dashboard)` group (e.g., `/dashboard`, `/dashboard/chat`).

2.  **Main Layout Component (`src/features/dashboard/components/dashboard-layout.tsx`):**
    *   This is a **Client Component** (`'use client';`) that orchestrates the overall dashboard shell.
    *   It manages the state for sidebar visibility (open/collapsed) and mobile responsiveness.
    *   It renders the `DashboardHeader` and `DashboardSidebar`.

3.  **Dashboard Header (`src/features/dashboard/layout/dashboard-header.tsx`):**
    *   A **Client Component** displayed at the top of the content area.
    *   Shows the current page title (derived from the URL segment).
    *   Contains a mobile menu toggle (for the sidebar) and a theme toggle.
    *   User avatar/info display is currently static for design verification but is intended to use `useAuth`.

4.  **Dashboard Sidebar (`src/features/dashboard/layout/dashboard-sidebar.tsx`):**
    *   A **Client Component** providing navigation.
    *   Contains navigation links (see `navItems` array within the component).
    *   Includes the `UserMenu` at the bottom.
    *   Supports a collapsed (icon-only) and expanded state.
    *   Its open/close state is controlled by `DashboardLayout`.

5.  **User Menu (`src/features/dashboard/layout/user-menu.tsx`):**
    *   A **Client Component** nested within the `DashboardSidebar`.
    *   Displays user information (currently static for design verification) and provides links to settings, support, and a logout action.
    *   When the sidebar is collapsed, clicking the `UserMenu` avatar area requests the sidebar to expand (via `onRequestSidebarExpand` prop).
    *   When the sidebar is expanded, clicking the `UserMenu` toggles an overlay menu with more options.

## Adding New Pages/Features to the Dashboard

To add a new feature or page (e.g., "Analytics") to the dashboard, follow these steps:

### 1. Create the Page Route

*   Add a new page file within the `src/app/(dashboard)/dashboard/` directory. For example, for an "Analytics" page accessible at `/dashboard/analytics`:
    *   Create `src/app/(dashboard)/dashboard/analytics/page.tsx`.
*   This page file will typically be a Server Component that imports and renders your main feature view component.

    ```tsx
    // src/app/(dashboard)/dashboard/analytics/page.tsx
    import { AnalyticsView } from '@/features/dashboard/analytics'; // Assuming this will be your feature view
    // You might add QueryClient, HydrationBoundary for server-side data prefetching here if needed.

    export default async function AnalyticsPage() {
      // Optional: Server-side logic, prefetching for TanStack Query
      // const queryClient = new QueryClient();
      // await queryClient.prefetchQuery(...);

      return (
        // <HydrationBoundary state={dehydrate(queryClient)}>
          <AnalyticsView />
        // </HydrationBoundary>
      );
    }
    ```

### 2. Create the Feature View and Components

*   Create a new directory for your feature under `src/features/dashboard/`. For example: `src/features/dashboard/analytics/`.
*   Inside this directory, create your main view component (e.g., `src/features/dashboard/analytics/analytics-view.tsx`). This component will contain the UI and logic for your new feature.
    *   It will usually be a Client Component (`'use client';`) if it needs interactivity or hooks.
*   Create any sub-components specific to this feature in a `components/` sub-directory (e.g., `src/features/dashboard/analytics/components/`).
*   Create a barrel file (`index.ts`) in your feature directory (e.g., `src/features/dashboard/analytics/index.ts`) to export its main view component:
    ```typescript
    // src/features/dashboard/analytics/index.ts
    export * from './analytics-view';
    ```

### 3. Add Navigation Link to Sidebar

*   Open `src/features/dashboard/layout/dashboard-sidebar.tsx`.
*   Locate the `navItems` array.
*   Add a new entry for your feature:

    ```typescript
    // src/features/dashboard/layout/dashboard-sidebar.tsx
    // ... other imports
    import { Activity } from 'lucide-react'; // Example icon

    const navItems: NavItem[] = [
      // ... existing items
      {
        title: "Analytics",
        href: "/dashboard/analytics",
        icon: <Activity className="h-5 w-5" />, // Choose an appropriate icon
      },
      // ... other existing items
    ];
    // ... rest of the component
    ```

## Accessing User Information in Dashboard Components

Client components within the dashboard (like `UserMenu`, or any component within a feature view) can access authenticated user information using the **`useAuth` hook** from `@/features/auth/hooks`.

### How User Data Flows:

1.  **Supabase Session**: When a user logs in, Supabase establishes a session.
2.  **`AuthSessionProvider`**:
    *   Located in `src/providers/auth-session-provider.tsx`.
    *   Uses React Context and Supabase's `onAuthStateChange` listener to make the raw Supabase `User` object and session loading state (`isSessionLoading`) available client-side.
3.  **`useUserProfileQuery`**:
    *   Located in `src/features/user-profile/hooks/use-user-profile-query.ts`.
    *   This TanStack Query hook fetches detailed user profile data (from your `profiles` table) via a Server Action (`getCurrentUserProfile` from `src/features/user-profile/queries/profile.queries.ts`).
    *   It's enabled when a `userId` (from the Supabase session) is available.
4.  **`useAuth` Hook**:
    *   Located in `src/features/auth/hooks/use-auth.ts`.
    *   This is the **primary hook** components should use.
    *   It consumes the session data from `AuthSessionProvider` and triggers `useUserProfileQuery`.
    *   It provides a comprehensive state:
        *   `user`: Raw Supabase user object.
        *   `profile`: Detailed `UserProfile` object.
        *   `authUser`: Combined `user` and `profile` (available when fully authenticated).
        *   `isAuthenticated`: True if both session and profile are loaded.
        *   `isLoadingAuth`: Composite loading state.
        *   `isSessionLoading`: True if only the session is still loading.
        *   And other error/loading states for session and profile.

### Example: Using `useAuth` in a Dashboard Component

```tsx
// src/features/dashboard/layout/user-menu.tsx (Simplified example section)
'use client';

import { useAuth } from '@/features/auth/hooks';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { UserCircle2 } from 'lucide-react';

// ... (rest of the UserMenu component)

export function UserMenu({ collapsed, onRequestSidebarExpand, notificationCount = 1 }: UserMenuProps) {
  const { 
    user, 
    profile, 
    isLoadingAuth, // Use composite loading for overall readiness
    isSessionLoading // Can be used for very basic "is there a session yet?" checks
  } = useAuth();

  // ... (other UserMenu logic: expanded state, menuRef, etc.)

  const getDisplayName = () => {
    if (profile?.firstName) return profile.firstName;
    if (user?.user_metadata?.first_name) return user.user_metadata.first_name as string;
    if (user?.email) return user.email.split('@')[0];
    return "User";
  };

  const getInitials = () => {
    const first = profile?.firstName?.[0] || user?.user_metadata?.first_name?.[0] || '';
    const last = profile?.lastName?.[0] || user?.user_metadata?.last_name?.[0] || '';
    return `${first}${last}`.toUpperCase() || <UserCircle2 size={18} />;
  };

  const avatarUrl = profile?.avatarUrl || user?.user_metadata?.avatar_url as string | undefined;

  // Handle loading state for user-specific display
  if (isSessionLoading) { // Show minimal loading for session check
    return (
      <div className="mt-auto border-t p-4 flex items-center gap-3 justify-center">
        <Skeleton className="h-9 w-9 rounded-full" />
        {!collapsed && <Skeleton className="h-4 w-24" />}
      </div>
    );
  }
  
  // If session is resolved, but full authUser (including profile) is still loading
  if (isLoadingAuth && user) { 
     return (
      <div className="mt-auto border-t p-4 flex items-center gap-3 justify-center">
        <Skeleton className="h-9 w-9 rounded-full" />
        {!collapsed && (
            <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-28" />
            </div>
        )}
      </div>
    );
  }

  // User is available (even if profile might still be loading for `displayName`)
  const currentDisplayName = getDisplayName();
  const currentInitials = getInitials();

  return (
    <div className="mt-auto border-t p-4 relative" ref={menuRef}>
      <div
        className={cn(
          "flex items-center gap-3 cursor-pointer",
          collapsed && "justify-center"
        )}
        onClick={toggleExpanded}
        // ... (rest of the div props)
      >
        <div className="relative">
          <Avatar className="h-9 w-9 text-sm">
            <AvatarImage src={avatarUrl || undefined} alt={currentDisplayName} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {currentInitials}
            </AvatarFallback>
          </Avatar>
          {/* ... badge ... */}
        </div>
        {!collapsed && (
          <>
            <div className="flex-1 overflow-hidden">
              <div className="font-medium truncate">{currentDisplayName}</div>
              <div className="truncate text-xs text-muted-foreground">
                {/* Display email or other info if available from profile or user */}
                {profile?.email || user?.email || 'No email'}
              </div>
            </div>
            {/* ... chevron icon ... */}
          </>
        )}
      </div>
      {/* ... AnimatePresence for menu items ... */}
    </div>
  );
}
```

**Key Takeaway for Developers:** For components inside the dashboard that need to display user-specific information or behave differently based on authentication status, import and use the `useAuth` hook. Refer to `docs/integrating-state-and-data-fetching.md` and `docs/project-overview.md` for a more detailed explanation of the entire authentication architecture.

## Related Application Parts

*   **`src/app/(dashboard)/`**: Next.js App Router route group containing all pages that fall under the dashboard layout.
*   **`src/features/chat/`**: The chat feature is typically accessed via the dashboard.
*   **`src/components/theme/theme-toggle.tsx`**: Used within the dashboard layout's header.
*   **`useAuth` hook (`src/features/auth/hooks/use-auth.ts`)**: Central hook for accessing authentication and user profile state.
*   **Error Logging**: Dashboard components and services should use `getServerLogger` for server-side logging and `Sentry.captureException` or `Sentry.captureMessage` for client-side error reporting as detailed in `docs/do_not_change_or_delete/future_plans/error logging.md`.

    