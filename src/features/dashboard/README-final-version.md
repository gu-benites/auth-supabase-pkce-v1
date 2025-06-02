
# Dashboard Feature (`src/features/dashboard/`)

## 1. Introduction

The Dashboard feature provides the main user interface and navigational structure for authenticated users of the PassForge application. It encompasses the primary layout (sidebar, header, content area) and serves as the entry point for various application modules and data presentation after a user logs in.

This document outlines the dashboard's architecture, key components, and how user information (like the profile) is efficiently fetched, managed, and displayed.

## 2. Setup and Installation

This module is an integral part of the PassForge application. No special setup beyond the main project installation is required to use the dashboard, provided authentication is configured correctly.

## 3. System Overview

The dashboard is built with a focus on server-side data prefetching for optimal initial load performance, combined with client-side interactivity and state management.

*   **Routing**: Dashboard routes (e.g., `/dashboard`, `/dashboard/chat`, `/dashboard/profile`) are managed by the Next.js App Router within the `src/app/(dashboard)/` route group.
*   **Layout**: A shared layout (`src/app/(dashboard)/layout.tsx`) applies a consistent UI shell and handles server-side prefetching of common data for all dashboard pages.
*   **State Management**:
    *   **User Session**: Raw Supabase session state is managed by `AuthSessionProvider` (React Context).
    *   **User Profile & Server Data**: User profile and other server-derived data are managed by TanStack Query, benefiting from server-side prefetching and client-side hydration.
    *   **UI State**: Local component state and the `useAuth` hook manage UI-specific states.

## 4. Components Description

### Core Layout Components:

*   **`src/app/(dashboard)/layout.tsx` (Route Group Layout - Server Component)**
    *   Purpose: Applies the visual dashboard shell to all routes within the `(dashboard)` group.
    *   Key Responsibility: **Server-side prefetching of the `userProfile`** for the authenticated user using a server-side `QueryClient`. Wraps children in `<HydrationBoundary>` to pass prefetched data to the client. Imports `DashboardLayout` from `@/features/dashboard/layout`.

*   **`src/features/dashboard/layout/dashboard-layout.tsx` (Client Component)**
    *   Purpose: The main UI orchestrator for the dashboard shell, rendered by the route group layout.
    *   Features: Manages sidebar visibility (open/collapsed, mobile responsiveness) and renders `DashboardHeader` and `DashboardSidebar` from `@/features/dashboard/components`.

*   **`src/features/dashboard/components/dashboard-header.tsx` (Client Component)**
    *   Purpose: Displays at the top of the content area.
    *   Features: Shows a dynamically generated page title based on the current `usePathname`, a mobile menu toggle, and a theme toggle.

*   **`src/features/dashboard/components/dashboard-sidebar.tsx` (Client Component)**
    *   Purpose: Provides primary navigation within the dashboard.
    *   Features: Contains navigation links, a user profile section (`DashboardUserMenu`), and supports collapsed/expanded states.

*   **`src/features/dashboard/components/dashboard-user-menu.tsx` (Client Component)**
    *   Purpose: Displays user's avatar, name/email, and provides links to Profile, Settings, and a Logout action (with confirmation dialog).
    *   Data: Uses the `useAuth` hook to access user session and profile data.

### Feature View Components:

These are the main content components for specific dashboard pages. They are typically client components.

*   **`src/features/dashboard/dashboard-homepage/dashboard-homepage-view.tsx`**
    *   Content for the main `/dashboard` page. Uses `useAuth` for the welcome message.
*   **`src/features/dashboard/chat/chat-view.tsx`**
    *   Main UI for the `/dashboard/chat` page.
*   **`src/features/user-profile/components/profile-display.tsx`** (Used by `/dashboard/profile/page.tsx`)
    *   Displays detailed user profile information, leveraging `useAuth`.

## 5. Data Flow for User Information (Profile)

The dashboard ensures user profile data is loaded efficiently:

1.  **Server-Side Prefetching**:
    *   When a user navigates to any page within the `/dashboard/*` routes, the `src/app/(dashboard)/layout.tsx` Server Component executes.
    *   It creates a new `QueryClient()` instance.
    *   It retrieves the authenticated user's ID using the server Supabase client.
    *   It calls `await queryClient.prefetchQuery({ queryKey: ['userProfile', userId], queryFn: getCurrentUserProfile })`. The `getCurrentUserProfile` is a Server Action that fetches the detailed profile data.
    *   The `queryClient`'s state, now containing the prefetched `userProfile`, is dehydrated.

2.  **Passing Data to Client**:
    *   The `src/app/(dashboard)/layout.tsx` wraps its `children` (which will be the specific page component like `DashboardPage` or `ProfilePage`) with `<HydrationBoundary state={dehydrate(queryClient)}>`. This makes the server-prefetched data available to the client-side TanStack Query cache.

3.  **Client-Side Hydration & Access**:
    *   On the client, the application is wrapped in `QueryClientProvider` (from `src/app/layout.tsx`).
    *   Dashboard components (e.g., `DashboardUserMenu`, `DashboardHomepageView`, `ProfileDisplay`) use the **`useAuth` hook** (`@/features/auth/hooks/use-auth.ts`).
    *   The `useAuth` hook internally calls `useUserProfileQuery` (from `@/features/user-profile/hooks/`).
    *   `useUserProfileQuery` uses TanStack Query's `useQuery` with the `queryKey: ['userProfile', userId]`.
    *   Upon initialization, TanStack Query checks its cache. If data for this `queryKey` exists (because it was passed via `HydrationBoundary`), it **hydrates** this data. This means the profile data is available *immediately* without an additional client-side fetch for the initial render.

4.  **Reactive Updates**:
    *   After initial hydration, TanStack Query manages the client-side caching, background updates, and stale-time for the `userProfile` data.
    *   The `AuthSessionProvider` continues to manage the live raw Supabase session state, and `useAuth` combines both session and profile information.

**Benefit**: This flow ensures that for authenticated users, their profile information is loaded rapidly, enhancing perceived performance as components like `DashboardUserMenu` and page-specific views can display personalized data almost instantly.

## 6. Files and Folder Structure (ASCII)

```
/src/
├── app/
│   └── (dashboard)/                    # Route Group for dashboard
│       ├── layout.tsx                  # Server Component: Prefetches userProfile, applies UI Shell
│       └── dashboard/                  # Base path for dashboard pages
│           ├── page.tsx                # Route: /dashboard
│           ├── chat/
│           │   └── page.tsx            # Route: /dashboard/chat
│           └── profile/
│               └── page.tsx            # Route: /dashboard/profile
│
└── features/
    └── dashboard/
        ├── README-final-version.md     # This documentation file
        ├── layout/                     # Main orchestrating layout component for the dashboard shell
        │   ├── dashboard-layout.tsx    # Client Component: Main UI shell (uses items from ../components/)
        │   └── index.ts                # Barrel file for layout/
        ├── components/                 # Reusable UI parts for the dashboard shell
        │   ├── dashboard-header.tsx    # Client Component: Header bar UI
        │   ├── dashboard-sidebar.tsx   # Client Component: Sidebar navigation UI
        │   ├── dashboard-user-menu.tsx # Client Component: Displays user info, auth links
        │   └── index.ts                # Barrel file for components/
        ├── dashboard-homepage/         # Feature: Content for the main /dashboard page
        │   ├── dashboard-homepage-view.tsx
        │   └── index.ts
        ├── chat/                       # Feature: Content for the /dashboard/chat page
        │   ├── chat-view.tsx
        │   ├── components/
        │   │   └── chat-input.tsx
        │   └── index.ts
        └── index.ts                    # Barrel file for dashboard feature exports (e.g., DashboardLayout)
```

## 7. Adding New Dashboard Pages

1.  **Create Route**: Add a new `page.tsx` file under `src/app/(dashboard)/dashboard/your-feature-name/page.tsx`.
    *   This page can also prefetch its own specific data using a `QueryClient` and `HydrationBoundary` if needed.
2.  **Create Feature View**: Develop your main UI component (e.g., `your-feature-view.tsx`) in `src/features/dashboard/your-feature-name/`.
3.  **Navigation**: Add a link to the new page in `src/features/dashboard/components/dashboard-sidebar.tsx`.
4.  **Access Data**: Use the `useAuth` hook within your feature view to access session and profile data. If you prefetched page-specific data, use `useQuery` for that.

## 8. Additional Notes

*   **Authentication**: The dashboard assumes a user is authenticated. Route protection is handled by middleware (`src/middleware.ts` delegating to `src/features/auth/utils/middleware.utils.ts`).
*   **Error Handling**: Errors during profile prefetching in the layout are logged, but the page will still attempt to render. Client-side data fetching errors are handled by TanStack Query and can be surfaced in components.
*   **Styling**: Uses ShadCN UI components and Tailwind CSS.
