
# Dashboard Feature (`src/features/dashboard`)

## Overview

The Dashboard feature provides the main user interface and navigational structure for authenticated users. It encompasses the primary layout, including a sidebar, header, and content area where various application modules and data are presented.

This README explains the current dashboard structure, how to add new pages/features to the dashboard, and how to access user information within dashboard components, including server-side prefetching strategies.

## Core Architecture

The dashboard is built around a few key components that work together:

1.  **Route Group Layout (`src/app/(dashboard)/layout.tsx`):**
    *   This Next.js App Router layout file applies the `DashboardLayoutComponent` to all routes within the `(dashboard)` group (e.g., `/dashboard`, `/dashboard/chat`).
    *   **Crucially, this layout is an `async` Server Component responsible for prefetching common data, such as the `userProfile`, for all dashboard pages.** It uses a `new QueryClient()`, calls `prefetchQuery`, and wraps its children in `<HydrationBoundary state={dehydrate(queryClient)}>`. This makes the prefetched data available for client-side hydration by TanStack Query.

2.  **Main Layout Component (`src/features/dashboard/components/dashboard-layout.tsx`):**
    *   This is a **Client Component** (`'use client';`) that orchestrates the overall dashboard shell (the visual parts like sidebar and header). It's rendered by `src/app/(dashboard)/layout.tsx`.
    *   It manages the state for sidebar visibility (open/collapsed) and mobile responsiveness.
    *   It renders the `DashboardHeader` and `DashboardSidebar`.

3.  **Dashboard Header (`src/features/dashboard/layout/dashboard-header.tsx`):**
    *   A **Client Component** displayed at the top of the content area.
    *   Shows the current page title (derived from the URL segment).
    *   Contains a mobile menu toggle (for the sidebar) and a theme toggle.

4.  **Dashboard Sidebar (`src/features/dashboard/layout/dashboard-sidebar.tsx`):**
    *   A **Client Component** providing navigation.
    *   Contains navigation links.
    *   Includes the `UserMenu` at the bottom.
    *   Supports a collapsed (icon-only) and expanded state.
    *   Its open/close state is controlled by `DashboardLayoutComponent`.

5.  **User Menu (`src/features/dashboard/layout/user-menu.tsx`):**
    *   A **Client Component** nested within the `DashboardSidebar`.
    *   Displays user information and provides links to settings, support, and a logout action.
    *   When the sidebar is collapsed, clicking the `UserMenu` avatar area requests the sidebar to expand.
    *   When the sidebar is expanded, clicking the `UserMenu` toggles an overlay menu with more options.

## Adding New Pages/Features to the Dashboard

To add a new feature or page (e.g., "Analytics") to the dashboard, follow these steps:

### 1. Create the Page Route

*   Add a new page file within the `src/app/(dashboard)/dashboard/` directory. For example, for an "Analytics" page accessible at `/dashboard/analytics`:
    *   Create `src/app/(dashboard)/dashboard/analytics/page.tsx`.
*   This page file will typically be an `async` Server Component if it needs to prefetch its own specific data.

    ```tsx
    // src/app/(dashboard)/dashboard/analytics/page.tsx
    import { AnalyticsView } from '@/features/dashboard/analytics';
    import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';
    // import { getAnalyticsData } from '@/features/dashboard/analytics/queries'; // Example query

    export default async function AnalyticsPage() {
      const queryClient = new QueryClient();

      // Example: Prefetch data specific to this analytics page
      // try {
      //   await queryClient.prefetchQuery({
      //     queryKey: ['analyticsData', /* any params */],
      //     queryFn: getAnalyticsData,
      //   });
      // } catch (error) {
      //   console.error("Failed to prefetch analytics data:", error);
      // }

      return (
        <HydrationBoundary state={dehydrate(queryClient)}>
          <AnalyticsView />
        </HydrationBoundary>
      );
    }
    ```
    *   **Note**: Common data like `userProfile` is already prefetched by the parent `src/app/(dashboard)/layout.tsx`. This page-level prefetching is for data unique to this specific "Analytics" page.

### 2. Create the Feature View and Components

*   Create a new directory for your feature under `src/features/dashboard/`. For example: `src/features/dashboard/analytics/`.
*   Inside this directory, create your main view component (e.g., `src/features/dashboard/analytics/analytics-view.tsx`). This component will contain the UI and logic for your new feature.
    *   It will usually be a Client Component (`'use client';`) if it needs interactivity or hooks (like `useQuery` for client-side fetching/updates).
*   Create any sub-components specific to this feature in a `components/` sub-directory (e.g., `src/features/dashboard/analytics/components/`).
*   Create Server Actions/query functions for data fetching/mutation in `src/features/dashboard/analytics/queries/` or `services/`.
*   Create a barrel file (`index.ts`) in your feature directory (e.g., `src/features/dashboard/analytics/index.ts`) to export its main view component.

### 3. Add Navigation Link to Sidebar

*   Open `src/features/dashboard/layout/dashboard-sidebar.tsx`.
*   Locate the `navItems` array and add a new entry for your feature.

## Accessing User Information and Data in Dashboard Components

### Data Flow for User Profile:

1.  **Server-Side Prefetching (in `src/app/(dashboard)/layout.tsx`):**
    *   The shared dashboard layout (`src/app/(dashboard)/layout.tsx`) is an `async` Server Component.
    *   It creates a `new QueryClient()`.
    *   It calls `await queryClient.prefetchQuery({ queryKey: ['userProfile', userId], queryFn: getCurrentUserProfile })`.
    *   The state of this `queryClient` is then dehydrated and passed to the client via the `<HydrationBoundary>` component.
2.  **Client-Side Hydration & Usage:**
    *   The root layout (`src/app/layout.tsx`) wraps the application in `<QueryClientProvider>`, making a client-side `QueryClient` instance available.
    *   When a dashboard page loads, TanStack Query on the client will automatically hydrate the data prefetched by the server into its own cache.
    *   The **`useAuth` hook** (`@/features/auth/hooks/use-auth.ts`) internally calls `useUserProfileQuery`.
    *   `useUserProfileQuery` (`@/features/user-profile/hooks/use-user-profile-query.ts`) uses `useQuery` with the same `queryKey: ['userProfile', userId]`. It will find the prefetched data in the cache, making the profile available immediately without an additional client-side fetch for the initial render.
    *   Client components within the dashboard (like `UserMenu` or your feature views) use `useAuth()` to get `profile`, `user`, `authUser`, `isAuthenticated`, `isLoadingAuth`, etc.

### Accessing Other Data (Feature-Specific):

1.  **Page-Level Prefetching (Optional, in `page.tsx`):**
    *   If a specific dashboard page (e.g., `/dashboard/analytics`) needs unique data on initial load, its `page.tsx` (which should be an `async` Server Component) can create a `new QueryClient()`, prefetch that data, and wrap its view component in `<HydrationBoundary>`.
2.  **Client-Side Fetching (in Feature View Components):**
    *   The Client Component for your feature (e.g., `AnalyticsView`) will use TanStack Query's `useQuery` hook to fetch or re-fetch data.
    *   If data was prefetched by its `page.tsx` (or by the shared layout for common data), `useQuery` will use the hydrated data initially.
    *   Example:
        ```tsx
        // src/features/dashboard/analytics/analytics-view.tsx
        'use client';
        import { useQuery } from '@tanstack/react-query';
        // import { getAnalyticsData } from './queries'; // Your server action for analytics
        import { useAuth } from '@/features/auth/hooks';

        export function AnalyticsView() {
          const { user, isAuthenticated } = useAuth();
          
          // const { data, isLoading, error } = useQuery({
          //   queryKey: ['analyticsData', user?.id],
          //   queryFn: () => getAnalyticsData(user?.id), // Call your server action
          //   enabled: isAuthenticated && !!user?.id,
          // });

          // if (isLoading) return <p>Loading analytics...</p>;
          // if (error) return <p>Error: {error.message}</p>;

          return (
            <div>
              <h2 className="text-2xl font-bold mb-4">Analytics</h2>
              {/* Render your data here */}
            </div>
          );
        }
        ```

By prefetching common data in the shared layout and page-specific data in individual page components, you can optimize initial load times. TanStack Query then handles client-side caching, background updates, and further data fetching as needed.
The `useAuth` hook remains the central point for accessing the user's identity and profile details throughout the dashboard features.

