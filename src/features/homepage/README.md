
# Homepage Feature (`src/features/homepage/`)

## 1. Overview

This feature module is responsible for rendering the main landing page of the PassForge application, accessible at the root URL (`/`). It aims to provide an engaging introduction to the application, highlight key features, and guide users towards sign-up or login. For authenticated users, it also aims to quickly display user-specific information in the header by leveraging server-side data prefetching.

## 2. Key Responsibilities

*   Display the primary marketing and informational content for new visitors.
*   Provide clear navigation to authentication pages (Login, Register) and potentially other key public pages (e.g., Profile if authenticated).
*   Offer a visually appealing and interactive experience to capture user interest.
*   For authenticated users, prefetch user profile data on the server to quickly populate the header.

## 3. Core Modules & Components

*   **`src/features/homepage/layout/homepage-layout.tsx`**: The main orchestrating component for the entire homepage experience. It renders the `HeroHeader`, `HeroCanvasBackground`, and `HeroContent`. This component was formerly `hero-section.tsx` and is rendered by `src/app/page.tsx`.
*   **`src/features/homepage/components/hero-header/hero-header.tsx`**: The main navigation header for the homepage.
    *   Integrates with the project's central `useAuth` hook (`@/features/auth/hooks/use-auth.ts`) to display dynamic content based on authentication state (e.g., user's name, appropriate auth buttons).
    *   Benefits from server-side prefetching of user profile data (initiated by `src/app/page.tsx`) for faster initial display of user information.
*   **`src/features/homepage/components/hero-content/hero-content.tsx`**: Contains the main marketing message, calls-to-action, and visuals of the hero section. Uses `framer-motion` for animations.
*   **`src/features/homepage/components/hero-canvas-background/hero-canvas-background.tsx`**: Renders an interactive dot-matrix background animation using HTML5 Canvas.
*   **`src/features/homepage/components/rotating-text/rotating-text.tsx`**: Component for animated rotating text effects.
*   **`src/features/homepage/components/shiny-text/shiny-text.tsx`**: Component for text with an animated shine effect.
*   **`src/features/homepage/constants/`**: Stores constants like navigation items and canvas animation parameters.
*   **`src/features/homepage/types/`**: TypeScript type definitions specific to the homepage feature.

## 4. Related Application Parts

*   **`src/app/page.tsx`**: The Next.js App Router entry point for the root URL (`/`).
    *   It's an **`async` Server Component**.
    *   If a user is authenticated, it attempts to **prefetch the `userProfile`** data on the server using `getCurrentUserProfile` from `@/features/user-auth-data/queries`.
    *   It wraps its content (`HomepageLayout`) in `<HydrationBoundary>` to make this prefetched data available for client-side TanStack Query hydration.
    *   Renders the `HomepageLayout` from `@/features/homepage/layout`.
*   **`src/features/auth/hooks/use-auth.ts`**: The `useAuth` hook is used by `HeroHeader` and `MobileMenu` to display appropriate authentication-related buttons and user information. It benefits from the hydrated profile data if it was prefetched by `src/app/page.tsx`.
*   **`src/features/user-auth-data/queries/profile.queries.ts`**: The `getCurrentUserProfile` Server Action is used by `src/app/page.tsx` for prefetching the user profile.
*   **`src/hooks/use-window-size.tsx`**: Used by `HeroCanvasBackground` to adapt to screen resizes.

## 5. Data Flow for Authenticated User on Homepage

1.  User visits the root URL (`/`).
2.  `src/app/page.tsx` (Server Component) executes.
3.  `supabase.auth.getUser()` (via `createClient` from `@/lib/supabase/server`) checks for an active session.
4.  If the user is authenticated, `src/app/page.tsx` calls `queryClient.prefetchQuery({ queryKey: ['userProfile', userId], queryFn: getCurrentUserProfile })`.
5.  The `userProfile` data (if successfully fetched) is dehydrated.
6.  `src/app/page.tsx` renders `HomepageLayout`, wrapping it in `<HydrationBoundary state={dehydrate(queryClient)}>`.
7.  The client loads. `AuthSessionProvider` establishes the client-side session state.
8.  `HeroHeader` (a Client Component within `HomepageLayout`) mounts and calls `useAuth()`.
9.  `useAuth()` internally calls `useUserProfileQuery()`.
10. `useUserProfileQuery()` (TanStack Query) finds the `userProfile` data (prefetched in step 4) in the hydrated state from `HydrationBoundary` and uses it as its initial data.
11. `HeroHeader` renders quickly, displaying the user's name/avatar without an additional client-side fetch for the initial profile display. If prefetching failed or the user was not authenticated during server render, `useUserProfileQuery` would proceed to fetch data client-side.

## 6. Files and Folder Structure (ASCII)

```
/src/features/homepage/
├── README.md     # This README file
├── components/
│   ├── hero-canvas-background/
│   │   └── hero-canvas-background.tsx
│   ├── hero-content/
│   │   ├── hero-content.tsx
│   │   └── works-with-icons.tsx
│   ├── hero-header/
│   │   ├── dropdown-item.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── hero-header.tsx
│   │   ├── icons.tsx
│   │   ├── mobile-menu.tsx
│   │   └── nav-link.tsx
│   ├── rotating-text/
│   │   └── rotating-text.tsx
│   ├── shiny-text/
│   │   └── shiny-text.tsx
│   └── index.ts                    # Barrel file for components
├── constants/
│   ├── hero-canvas-background-constants.ts
│   ├── hero-header-constants.ts
│   └── index.ts
├── layout/
│   ├── homepage-layout.tsx         # Main orchestrator (formerly hero-section.tsx)
│   └── index.ts                    # Barrel file for layout exports HomepageLayout
├── types/
│   ├── hero-canvas-background-types.ts
│   ├── hero-header-types.ts
│   └── index.ts
└── index.ts                        # Main barrel file for homepage feature (exports HomepageLayout)
```
