
# State Management and Data Fetching Architecture

This document provides a comprehensive overview of the state management and data fetching strategy employed in this Next.js application. Our approach leverages React Context for raw session management, TanStack Query for robust server state handling (including user profiles), a composite `useAuth` hook for convenient client-side access, and Zustand for minimal, purely client-side global state.

## Core Architectural Pillars

Our architecture is built on four key pillars, each serving a distinct purpose:

1.  **React Context (`AuthSessionProvider`)**: Manages the raw Supabase session state. This includes the Supabase `User` object, the initial session loading status, and any errors encountered during session establishment.
    *   **Location**: `@/providers/auth-session-provider.tsx`

2.  **TanStack Query (React Query)**: The primary tool for fetching, caching, and synchronizing server state. This is heavily used for detailed user profile data (managed by the `@/features/user-auth-data/` feature) and is designed to work seamlessly with server-side prefetching and client-side hydration.
    *   **Key Hooks**: `useUserProfileQuery` from `@/features/user-auth-data/hooks/use-user-profile-query.ts` (and similar hooks for other data).

3.  **The `useAuth` Hook**: Acts as the central, unified API for client components to access comprehensive authentication and user profile information. It intelligently combines data from `AuthSessionProvider` and TanStack Query.
    *   **Location**: `@/features/auth/hooks/use-auth.ts`

4.  **Zustand**: Reserved for minimal, purely client-side global state that is *not* directly tied to server data or core authentication sessions (e.g., UI preferences like theme settings, ephemeral UI toggles).
    *   **Location**: `@/stores/auth.store.ts` (Note: The current project uses this file primarily as a placeholder for this pattern).

## In-Depth Explanation of Each Pillar

### 1. Raw Session State: `AuthSessionProvider` (React Context)

*   **Purpose**: To provide the raw Supabase `User` object and track the initial loading state of the Supabase session throughout the application.
*   **Mechanism**:
    *   It's a Client Component (`'use client'`).
    *   Initializes a Supabase browser client (`@/lib/supabase/client.ts`).
    *   Sets up a Supabase `onAuthStateChange` listener to reactively update the session state (`user`, `isLoading`, `error`).
    *   The `isLoading` state is true until the `INITIAL_SESSION` event is received or a fallback timeout occurs, indicating that the initial check for an existing session is complete.
*   **Usage**: Wrapped around the application's main content within `src/app/layout.tsx`, making session state accessible to all child components.

### 2. User Profile & Server Data Management (TanStack Query)

This pillar focuses on fetching and managing data that originates from the server, most notably the detailed user profile.

#### a. Core User Data Feature (`@/features/user-auth-data/`)

This dedicated feature centralizes the logic for user profile data:
*   **Schemas (`schemas/profile.schema.ts`)**: Defines the `UserProfileSchema` (Zod) and `UserProfile` type, representing data from your `profiles` table and relevant `auth.users` fields.
*   **Services (`services/profile.service.ts`)**: Contains server-side functions (marked with `'use server'`) like `getProfileByUserId` that perform direct database interactions (e.g., querying the `profiles` table using the server Supabase client).
*   **Queries (`queries/profile.queries.ts`)**: Contains Server Actions like `getCurrentUserProfile`. These actions are designed as `queryFn` for TanStack Query. They typically:
    1.  Get the authenticated user (using server Supabase client).
    2.  Call the relevant service function (e.g., `getProfileByUserId`).
    3.  Validate the data against the Zod schema.
    4.  Return the data or throw an error.

#### b. Server-Side Prefetching (in Layouts/Pages)

To enhance initial page load performance, critical data like the user profile is prefetched on the server for authenticated users.
*   **Examples**:
    *   `src/app/(dashboard)/layout.tsx`: Prefetches `userProfile` for all dashboard routes.
    *   `src/app/page.tsx`: Prefetches `userProfile` if a user is authenticated on the homepage.
*   **Process**:
    1.  The layout/page (e.g., `src/app/(dashboard)/layout.tsx`) is an `async` Server Component.
    2.  It creates a `new QueryClient()` instance for server-side operations.
    3.  It checks for an authenticated user using the server-side Supabase client (`@/lib/supabase/server.ts`).
    4.  If authenticated, it calls `await queryClient.prefetchQuery({ queryKey: ['userProfile', userId], queryFn: getCurrentUserProfile })`. This populates the server-side query client's cache.
    5.  The state of this `queryClient` is then **dehydrated** using `dehydrate(queryClient)`.
    6.  The dehydrated state is passed to the client via Next.js's `<HydrationBoundary state={dehydrate(queryClient)}>`, which wraps the child components.

#### c. Client-Side Hook: `useUserProfileQuery`

*   **Location**: `@/features/user-auth-data/hooks/use-user-profile-query.ts`.
*   **Purpose**: Provides client-side components with easy access to the user profile data, managed by TanStack Query.
*   **Mechanism**:
    *   It's a Client Component hook (`'use client'`).
    *   Uses TanStack Query's `useQuery`.
    *   `queryKey`: `['userProfile', userId]` (matches the key used for prefetching).
    *   `queryFn`: Calls the `getCurrentUserProfile` Server Action from `@/features/user-auth-data/queries/`.
    *   **Hydration**: On initial client load, `useQuery` checks the data passed via `HydrationBoundary`. If data for its `queryKey` exists (because it was prefetched on the server), TanStack Query **hydrates** this data into its client-side cache. This makes the profile data available *immediately* without an additional client-side fetch for the initial render.
    *   `enabled`: The query is typically enabled only when a `userId` is available (i.e., the user is authenticated).
    *   TanStack Query then manages client-side caching, background updates, and stale-time for this data.

### 3. Unified Access: The `useAuth` Hook

*   **Location**: `@/features/auth/hooks/use-auth.ts`.
*   **Purpose**: To provide a single, convenient, and comprehensive interface for client components to access all relevant authentication and user information.
*   **Mechanism**:
    *   It's a Client Component hook (`'use client'`).
    *   Consumes `AuthSessionContext` (via `useAuthSession()`) to get the raw Supabase `user` object, `isSessionLoading` status, and `sessionError`.
    *   Calls `useUserProfileQuery()` to get the detailed `profile` data (which benefits from server-side prefetching and hydration).
    *   Combines these states to provide a rich `AuthState` object, including:
        *   `user`: The raw Supabase `User` object (or `null`).
        *   `profile`: The detailed `UserProfile` object (or `undefined` if not loaded/found).
        *   `authUser`: A combined object of `user` and `profile` data, available when fully authenticated and profile is loaded.
        *   `isAuthenticated`: A stricter boolean flag; `true` only if a Supabase session exists AND the detailed profile has been successfully loaded.
        *   `isLoadingAuth`: A composite loading state; `true` if the session is still loading, or if the session exists but the profile is still loading.
        *   `isSessionLoading`: Specifically for `AuthSessionProvider`'s initial session check.
        *   `sessionError`: Specifically for errors from `AuthSessionProvider`.
        *   `isProfileLoading`: Specifically for profile data fetching.
        *   `profileError`: Specifically for errors from profile data fetching.
*   **Usage**: This is the **recommended hook** for most client components needing auth information or user profile details.

### 4. Minimal Global Client-Side State (Zustand)

*   **Location**: `@/stores/auth.store.ts` (The name reflects its historical use, but its role has evolved).
*   **Purpose**: Zustand is reserved for global client-side state that is *not* directly tied to server data or core authentication sessions. Examples include:
    *   UI preferences (e.g., theme settings, if not managed by `next-themes`).
    *   Application-wide UI toggles (e.g., visibility of a non-persistent tour guide).
    *   Ephemeral state that needs to be shared across unrelated components.
*   **Current Status**: In the current project, this store is largely a placeholder (e.g., `GlobalSettingsState` example) demonstrating the pattern. Core authentication and profile data are handled by Context and TanStack Query.

## Illustrative Data Flow: Displaying User Info in Dashboard

This example shows how user data becomes available to a component in the dashboard:

1.  **Navigation**: User navigates to a dashboard page (e.g., `/dashboard/profile`).
2.  **Server-Side (Layout)**:
    *   `src/app/(dashboard)/layout.tsx` (async Server Component) executes.
    *   It authenticates the user and fetches the `userId`.
    *   It calls `queryClient.prefetchQuery({ queryKey: ['userProfile', userId], queryFn: getCurrentUserProfile })`.
    *   The fetched `userProfile` data is dehydrated and passed to the client via `<HydrationBoundary>`.
3.  **Client-Side (Initialization)**:
    *   The browser loads the page.
    *   `AuthSessionProvider` initializes and establishes the client-side Supabase session, making the raw `User` object available.
    *   `QueryClientProvider` sets up the TanStack Query client.
4.  **Client-Side (Component Render)**:
    *   A component like `ProfileView` (for `/dashboard/profile`) or `DashboardUserMenu` mounts.
    *   It calls the `useAuth()` hook.
5.  **`useAuth` Hook Execution**:
    *   `useAuth()` consumes the session from `AuthSessionContext` (via `useAuthSession()`).
    *   `useAuth()` calls `useUserProfileQuery({ userId })`.
6.  **`useUserProfileQuery` Execution**:
    *   `useQuery` (from TanStack Query) initializes.
    *   It checks the `HydrationBoundary` data provided by the server. Since the `queryKey: ['userProfile', userId]` matches the prefetched data, TanStack Query **hydrates** this server-fetched data into its client-side cache.
    *   The `profile` data is available *immediately* as `initialData`.
7.  **Rendering**:
    *   `useAuth()` returns the combined state, including the hydrated `profile`.
    *   The component (`ProfileView` or `DashboardUserMenu`) renders quickly, displaying the user's name, avatar, and other profile details without waiting for a new client-side API call for this initial data.
    *   TanStack Query will then manage this data according to its `staleTime`, `gcTime`, and refetching configurations.

## Guidelines for Adding New Data-Driven Features

When building new features that require data from the server, follow this general pattern:

1.  **Define Zod Schema**: Create a Zod schema for your data in an appropriate feature directory (e.g., `src/features/your-feature/schemas/your-data.schema.ts`).
2.  **Create Service Function (`'use server'`)**:
    *   Location: `src/features/your-feature/services/your-data.service.ts`.
    *   Purpose: Encapsulates the direct database query or external API call. Uses the server-side Supabase client if interacting with your database.
3.  **Create Server Action (Query Function - `'use server'`):**
    *   Location: `src/features/your-feature/queries/your-data.queries.ts`.
    *   Purpose: Acts as the `queryFn` for TanStack Query.
    *   Responsibilities:
        *   Handles any necessary authentication/authorization checks.
        *   Calls the corresponding service function.
        *   Validates the fetched data against the Zod schema.
        *   Returns the validated data or throws an appropriate error.
4.  **Create Custom Hook with `useQuery` (`'use client'`):**
    *   Location: `src/features/your-feature/hooks/use-your-data-query.ts`.
    *   Purpose: Provides a clean interface for client components to fetch and use the data.
    *   Mechanism: Calls the Server Action (created in step 3) as its `queryFn`.
5.  **Utilize in UI Component (`'use client'`):**
    *   The client component imports and uses the custom hook from step 4 to get data, loading states, and error states.
6.  **Optional: Server-Side Prefetching**:
    *   If the data for this new feature is critical for the initial render of a specific page and you want to avoid client-side loading spinners for that data, you can prefetch it.
    *   The relevant page (e.g., `src/app/your-feature-page/page.tsx`) would need to be an `async` Server Component.
    *   Inside this Server Component, create a `QueryClient`, prefetch the data using the same `queryKey` and `queryFn` (your Server Action) as the client-side hook, and pass the dehydrated state via `<HydrationBoundary>`.

## Conclusion

This layered architecture for state management and data fetching provides a robust, maintainable, and performant foundation for the application. By clearly separating concerns—raw session state, server-data fetching and caching, unified client-side access, and minimal global UI state—we can build complex features more efficiently. Server-side prefetching with client-side hydration via TanStack Query is key to delivering a fast initial user experience.
