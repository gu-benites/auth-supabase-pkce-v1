
# Homepage Feature (`src/features/homepage`)

## Overview

This feature module is responsible for rendering the main landing page of the PassForge application, accessible at the root URL (`/`). It aims to provide an engaging introduction to the application, highlight key features, and guide users towards sign-up or login. For authenticated users, it also aims to quickly display user-specific information in the header.

## Key Responsibilities

*   Display the primary marketing and informational content for new visitors.
*   Provide clear navigation to authentication pages (Login, Register) and potentially other key public pages (e.g., Profile if authenticated).
*   Offer a visually appealing and interactive experience to capture user interest.
*   **For authenticated users, prefetch user profile data on the server to quickly populate the header.**

## Core Modules

*   **`hero-section.tsx`**: The main orchestrating component that brings together all parts of the homepage (header, canvas background, content). Rendered by `src/app/page.tsx`.
*   **`components/hero-header/`**: Contains components related to the homepage's navigation header:
    *   `hero-header.tsx`: The main header component. It integrates with `useAuth` hook. For authenticated users, it benefits from server-side prefetching of the user profile done by `src/app/page.tsx` for faster display of user information.
    *   `nav-link.tsx`, `dropdown-menu.tsx`, `mobile-menu.tsx`: Reusable components for navigation.
*   **`components/hero-content/`**: Main textual content and CTAs.
*   **`components/hero-canvas-background/`**: Interactive dot-matrix background.
*   **`components/rotating-text/` & `components/shiny-text/`**: Animated text effects.
*   **`constants/` & `types/`**: Feature-specific constants and types.

## Related Application Parts

*   **`src/app/page.tsx`**: The Next.js App Router entry point for `/`. It's an **`async` Server Component**.
    *   If a user is authenticated, it attempts to **prefetch the `userProfile`** data on the server.
    *   It wraps its content in `<HydrationBoundary>` to make this prefetched data available for client-side TanStack Query hydration.
    *   Renders the `HomepageLayout` (which in turn renders `HeroSection`).
*   **`src/features/auth/hooks/use-auth.ts`**: Used by `HeroHeader` and `MobileMenu`. Benefits from hydrated profile data if prefetched by `src/app/page.tsx`.
*   **`src/features/user-profile/queries/profile.queries.ts`**: The `getCurrentUserProfile` Server Action is used for prefetching.
*   **`src/hooks/use-window-size.tsx`**: Used by `HeroCanvasBackground`.

## Data Flow for Authenticated User on Homepage

1.  User visits `/`.
2.  `src/app/page.tsx` (Server Component) executes.
3.  `supabase.auth.getUser()` checks for an active session.
4.  If authenticated, `page.tsx` calls `queryClient.prefetchQuery(['userProfile', userId], getCurrentUserProfile)`.
5.  The `userProfile` data is dehydrated and passed to the client via `HydrationBoundary`.
6.  Client loads. `AuthSessionProvider` establishes the session.
7.  `HeroHeader` (Client Component) mounts and calls `useAuth()`.
8.  `useAuth()` calls `useUserProfileQuery()`.
9.  `useUserProfileQuery()` finds the `userProfile` data (from step 4) in the hydrated state from `HydrationBoundary` and uses it immediately.
10. `HeroHeader` renders quickly with the user's name/avatar without an additional client-side fetch for the initial profile display.

## Detailed Documentation

For a more in-depth understanding of the homepage's original template architecture, refer to the [Purchased Homepage Template Detailed Documentation](/docs/do_not_change_or_delete/purchased_homepage_template/homepage-docs.md). Note that authentication state and profile data fetching in header components are now integrated with the project's central `useAuth` hook and server-side prefetching.
