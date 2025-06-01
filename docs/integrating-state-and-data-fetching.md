
# Integrating State and Data Fetching (Context, TanStack Query, Zustand)

This document outlines the recommended approach for managing state and fetching data in this Next.js project, particularly focusing on authentication state, user profile data, and global client-side state. We leverage React Context (`AuthSessionProvider`), TanStack Query (React Query), a composite `useAuth` hook, and Zustand for distinct purposes to create a robust and scalable architecture.

## Core Principles:

1.  **Raw Session State (React Context):** The `AuthSessionProvider` (`@/providers/auth-session-provider.tsx`) uses React Context to make the raw Supabase `User` object, initial session loading status (`isSessionLoading`), and session-related errors (`sessionError`) available throughout the application. This is the foundational layer for knowing if a Supabase session exists.
2.  **Server State & Data Fetching (TanStack Query):** TanStack Query is the primary tool for fetching, caching, and synchronizing server state. This includes detailed user profiles (from your `profiles` table via `src/features/user-profile/hooks/use-user-profile-query.ts`) and any other data retrieved from your backend (Supabase).
    *   **Server-Side Prefetching:** For key pages/layouts (like `src/app/(dashboard)/layout.tsx` and `src/app/page.tsx`), common data like the user profile is prefetched on the server if a user is authenticated. This prefetched data is then passed to the client via Next.js's `<HydrationBoundary>` component.
    *   **Client-Side Hydration:** On the client, TanStack Query (via `useQuery` in hooks like `useUserProfileQuery`) automatically hydrates this server-prefetched data into its cache if the query keys match. This provides fast initial data rendering.
3.  **Composite Auth State Hook (`useAuth`):** The `useAuth` hook (`@/features/auth/hooks/use-auth.ts`) acts as the main interface for client components to access comprehensive authentication information. It consumes the raw session from `AuthSessionProvider` and triggers the fetching of the detailed user profile using TanStack Query (via `useUserProfileQuery`). It provides various states like `user` (raw Supabase user), `profile` (detailed profile, initially from hydrated data if available), `authUser` (combined user and profile when fully authenticated), a stricter `isAuthenticated` (session AND profile ready), `isLoadingAuth` (composite), `isSessionLoading` (session-only loading), `sessionError`, `isProfileLoading`, and `profileError`.
4.  **Minimal Global Client-Side State (Zustand):** Zustand (`@/stores/auth.store.ts`) is reserved for global client-side state that is *not* directly tied to server data or core authentication sessions (e.g., UI preferences, theme settings).

## I. Authentication State Management

Client components should primarily use the **`useAuth` hook** (`@/features/auth/hooks/use-auth.ts`) to get information about the current user and their authentication status.

### 1. `AuthSessionProvider` (React Context - `@/providers/auth-session-provider.tsx`)
*   **Purpose:** Provides the raw Supabase `User` object and tracks the initial loading state of the Supabase session.
*   **Implementation:**
    *   Client Component (`'use client'`).
    *   Uses the Supabase browser client (`@/lib/supabase/client`).
    *   Initializes a Supabase `onAuthStateChange` listener to reactively update session state.
    *   Exposes `{ user: User | null, isLoading: boolean, error: Error | null }` via React Context.
*   **Usage:** Wrapped around the application's main content within `src/app/layout.tsx`.

### 2. Server-Side Prefetching (in Layouts/Pages like `src/app/(dashboard)/layout.tsx` and `src/app/page.tsx`)
*   **Purpose:** To fetch critical data (like the user profile for an authenticated user) on the server during the initial request.
*   **Implementation:**
    *   The relevant layout/page (e.g., `src/app/(dashboard)/layout.tsx` or `src/app/page.tsx`) is an `async` Server Component.
    *   It creates a `new QueryClient()` for server-side operations.
    *   It checks if a user is authenticated (using `createClient` from `@/lib/supabase/server`).
    *   If authenticated, it calls `await queryClient.prefetchQuery({ queryKey: ['userProfile', userId], queryFn: getCurrentUserProfile })`.
    *   The state of this `queryClient` is then dehydrated and passed to the client via the `<HydrationBoundary state={dehydrate(queryClient)}>`.

### 3. `useUserProfileQuery` (TanStack Query Hook - `@/features/user-profile/hooks/use-user-profile-query.ts`)
*   **Purpose:** Fetches the detailed user profile data from the backend (your `profiles` table).
*   **Implementation:**
    *   Client-side hook (`'use client'`).
    *   Uses TanStack Query's `useQuery`.
    *   `queryKey`: `['userProfile', userId]`.
    *   `queryFn`: Calls the `getCurrentUserProfile` Server Action.
    *   **Hydration**: On initial client load, `useQuery` will check the data passed via `HydrationBoundary`. If data for its `queryKey` exists, it will be used as the initial data, avoiding an immediate client-side refetch.
    *   `enabled`: Typically enabled only when a user ID is available.
*   **Schema**: Uses `UserProfileSchema` from `@/features/user-profile/schemas/profile.schema.ts`.

### 4. `useAuth` Hook (Composite Hook - `@/features/auth/hooks/use-auth.ts`)
*   **Purpose:** Provides a unified and convenient way for components to access all relevant authentication and user information.
*   **Implementation:**
    *   Client-side hook (`'use client'`).
    *   Consumes `AuthSessionContext` for raw session state.
    *   Calls `useUserProfileQuery()` for profile data (which benefits from server-side prefetching and hydration).
    *   Combines these states to provide `user`, `profile`, `authUser`, `isAuthenticated`, `isLoadingAuth`, etc.
*   **Usage:** This is the **recommended hook** for most client components needing auth information.

**Example Data Flow for `HeroHeader`:**
1.  User visits `/` (homepage).
2.  `src/app/page.tsx` (Server Component) executes.
3.  If user is authenticated, `page.tsx` prefetches `userProfile` and passes it in `HydrationBoundary`.
4.  Client loads. `AuthSessionProvider` establishes the session.
5.  `HeroHeader` (Client Component) mounts and calls `useAuth()`.
6.  `useAuth()` calls `useUserProfileQuery()`.
7.  `useUserProfileQuery()` finds the `userProfile` data (from step 3) in the hydrated state from `HydrationBoundary` and uses it immediately.
8.  `HeroHeader` renders quickly with user's name/avatar.

## II. Global Client-Side State (Zustand)

The role of Zustand (`src/stores/auth.store.ts`) is focused on **minimal, purely client-side global state that is NOT directly tied to auth session or server-fetched profile data** (e.g., UI preferences, theme settings).

## III. Data Fetching for Other Features (TanStack Query)

When building new features that require data from the server:
1.  **Zod Schema**.
2.  **Service Function (`'use server'`)**: Direct Supabase/API calls.
3.  **Server Action (Query Function - `'use server'`):** Calls service, handles auth, returns validated data or throws.
4.  **Custom Hook with `useQuery` (`'use client'`):** Calls the Server Action as its `queryFn`.
5.  **UI Component (`'use client'`):** Uses the custom hook.
    *   **Optional Prefetching**: If this feature's data is critical for initial render on a specific page, that page's `page.tsx` (as an `async` Server Component) can prefetch this data and provide it via `HydrationBoundary`, similar to how user profile is handled.

## Conclusion

This refined approach leverages:
*   **React Context (`AuthSessionProvider`)**: For raw Supabase session state.
*   **Server-Side Prefetching + TanStack Query + HydrationBoundary**: For efficient initial loading of server state (like user profiles) into client-side TanStack Query cache.
*   **TanStack Query (`useQuery`)**: For robust client-side server state management.
*   **`useAuth` Hook**: For a unified API to auth and profile state.
*   **Zustand**: For other global, client-side UI state.
