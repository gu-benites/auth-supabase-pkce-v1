
# Integrating State and Data Fetching (Context, TanStack Query, Zustand)

This document outlines the recommended approach for managing state and fetching data in this Next.js project, particularly focusing on authentication state, user profile data, and global client-side state. We leverage React Context (`AuthSessionProvider`), TanStack Query (React Query), a composite `useAuth` hook, and Zustand for distinct purposes to create a robust and scalable architecture.

## Core Principles:

1.  **Raw Session State (React Context):** The `AuthSessionProvider` (`@/providers/auth-session-provider.tsx`) uses React Context to make the raw Supabase `User` object, initial session loading status (`isSessionLoading`), and session-related errors (`sessionError`) available throughout the application. This is the foundational layer for knowing if a Supabase session exists.
2.  **Server State & Data Fetching (TanStack Query):** TanStack Query is the primary tool for fetching, caching, and synchronizing server state. This includes detailed user profiles (from your `profiles` table via `src/features/user-profile/hooks/use-user-profile-query.ts`) and any other data retrieved from your backend (Supabase).
3.  **Composite Auth State Hook (`useAuth`):** The `useAuth` hook (`@/features/auth/hooks/use-auth.ts`) acts as the main interface for client components to access comprehensive authentication information. It consumes the raw session from `AuthSessionProvider` and triggers the fetching of the detailed user profile using TanStack Query (via `useUserProfileQuery`). It provides various states like `user` (raw Supabase user), `profile` (detailed profile), `authUser` (combined user and profile when fully authenticated), a stricter `isAuthenticated` (session AND profile ready), `isLoadingAuth` (composite), `isSessionLoading` (session-only loading), `sessionError`, `isProfileLoading`, and `profileError`.
4.  **Minimal Global Client-Side State (Zustand):** Zustand (`@/stores/auth.store.ts`) is reserved for global client-side state that is *not* directly tied to server data or core authentication sessions (e.g., UI preferences, theme settings).

## I. Authentication State Management

Client components should primarily use the **`useAuth` hook** (`@/features/auth/hooks/use-auth.ts`) to get information about the current user and their authentication status.

### 1. `AuthSessionProvider` (React Context - `@/providers/auth-session-provider.tsx`)
*   **Purpose:** Provides the raw Supabase `User` object and tracks the initial loading state of the Supabase session.
*   **Implementation:**
    *   Client Component (`'use client'`).
    *   Uses the Supabase browser client (`@/lib/supabase/client`), ensuring the client instance is stable across renders (e.g., using `useState(() => createClient())`).
    *   Initializes a Supabase `onAuthStateChange` listener. This listener is crucial:
        *   It reactively updates the `user` object in the context when auth events like `SIGNED_IN`, `SIGNED_OUT`, or `TOKEN_REFRESHED` occur.
        *   The `INITIAL_SESSION` event from this listener is the primary signal that Supabase has determined the initial authentication state. When this (or `SIGNED_IN`/`SIGNED_OUT`) event is received, the provider sets its `isLoading` flag to `false`.
        *   A fallback timeout mechanism ensures `isLoading` eventually becomes `false` if no definitive auth event is received promptly (e.g., for a new visitor with no existing session).
    *   Exposes `{ user: User | null, isLoading: boolean, error: Error | null }` via React Context.
    *   `isLoading` here specifically refers to the process of determining the initial session state by `AuthSessionProvider`.
*   **Usage:** Wrapped around the application's main content within `src/app/layout.tsx`.

### 2. `useUserProfileQuery` (TanStack Query Hook - `@/features/user-profile/hooks/use-user-profile-query.ts`)
*   **Purpose:** Fetches the detailed user profile data from the backend (your `profiles` table).
*   **Implementation:**
    *   Client-side hook (`'use client'`).
    *   Uses TanStack Query's `useQuery`.
    *   `queryKey`: `['userProfile', userId]` (dynamically uses the authenticated user's ID).
    *   `queryFn`: Calls the `getCurrentUserProfile` Server Action (`@/features/user-profile/queries/profile.queries.ts`), which in turn calls a service function (`@/features/user-profile/services/profile.service.ts`) to fetch data from your `profiles` table (and merges with `auth.users` data like email).
    *   `enabled`: Typically enabled only when a user ID is available (i.e., `!isSessionLoading && !!user?.id` from `useAuth`).
    *   Manages its own loading (`isProfileLoading`), error (`profileError`), and data states for the profile fetching operation.
*   **Schema**: Uses `UserProfileSchema` from `@/features/user-profile/schemas/profile.schema.ts` for data shape.

### 3. `useAuth` Hook (Composite Hook - `@/features/auth/hooks/use-auth.ts`)
*   **Purpose:** Provides a unified and convenient way for components to access all relevant authentication and user information.
*   **Implementation:**
    *   Client-side hook (`'use client'`).
    *   Consumes `AuthSessionContext` (via `useAuthSession()`) to get the raw `user`, `isSessionLoading`, and `sessionError`.
    *   Calls `useUserProfileQuery()` to get the `profile` data and its associated loading/error states (`isProfileLoading`, `profileError`).
    *   **Combines these states to provide**:
        *   `user`: The raw Supabase user object from the session.
        *   `profile`: The detailed user profile data (from TanStack Query).
        *   `authUser`: A combined object of `user` and `profile` data, available when the stricter `isAuthenticated` is true.
        *   `isAuthenticated`: **Stricter definition.** Boolean, true only if a Supabase session exists (`!!user` is true, `isSessionLoading` is false) AND the detailed user profile has been successfully loaded (`!!profile` is true, `isProfileLoading` is false).
        *   `isLoadingAuth`: Composite boolean. True if `isSessionLoading` is true, OR if a session user exists (`!!user`) but the profile is still loading (`isProfileLoading`). This indicates the overall authentication and profile data is not yet fully ready.
        *   `isSessionLoading`: Boolean reflecting only the `AuthSessionProvider`'s loading state for the raw session. **Crucial for UI to quickly show "Login" vs "Profile/Sign Out" states for header buttons.**
        *   `sessionError`: Error object reflecting only session provider errors.
        *   `isProfileLoading`: Boolean reflecting only the profile query's loading state.
        *   `profileError`: Error object reflecting only profile query errors.
*   **Usage:** This is the **recommended hook** for most client components needing auth information.
    *   For UI elements that *only* depend on knowing if a basic Supabase session exists (e.g., showing Login/Register vs. Profile/Sign Out buttons), components should primarily check `isSessionLoading` and `!!user`.
    *   For UI elements that require the detailed user profile to be loaded (e.g., displaying the user's full name from the `profiles` table), components should check the stricter `isAuthenticated` or `!isLoadingAuth && !!authUser`.

**Example: `HomepageHeader` using the `useAuth` hook**
```tsx
// src/features/homepage/components/hero-header/hero-header.tsx
'use client';

import Link from 'next/link';
import { PassForgeLogo } from '@/components/icons';
import { Loader2, UserCircle2 } from 'lucide-react';
import { Button, Avatar, AvatarFallback, AvatarImage } from '@/components/ui';
import { signOutUserAction } from '@/features/auth/actions';
import { useAuth } from '@/features/auth/hooks'; // The composite auth hook

export function HeroHeader(): JSX.Element {
  const {
    user, // Raw Supabase user from session
    profile,
    // authUser, // Available when stricter isAuthenticated is true
    isAuthenticated, // Stricter: true if session AND profile are loaded
    isLoadingAuth, // Composite: session OR (session + profile loading)
    isSessionLoading, // Use this for the initial "Am I logged in?" check for basic UI
    // sessionError,
    // isProfileLoading,
    // profileError
  } = useAuth();

  // Use this for determining visibility of core auth controls (Login/Register vs Profile/Sign Out)
  const hasActiveSession = !isSessionLoading && !!user;

  const getDisplayName = () => {
    // Prefer profile data if available and loaded, otherwise fallback
    if (profile?.firstName) return profile.firstName;
    const userMetaFirstName = user?.user_metadata?.first_name as string | undefined;
    if (userMetaFirstName) return userMetaFirstName;
    if (user?.email) return user.email.split('@')[0];
    return 'User';
  };

  const getInitials = () => {
    const firstName = profile?.firstName || (user?.user_metadata?.first_name as string | undefined);
    const lastName = profile?.lastName || (user?.user_metadata?.last_name as string | undefined);
    const firstInitial = firstName?.[0] || '';
    const lastInitial = lastName?.[0] || '';
    const initials = `${firstInitial}${lastInitial}`.toUpperCase();
    return initials || <UserCircle2 size={18} />;
  };

  const avatarUrl = profile?.avatarUrl || (user?.user_metadata?.avatar_url as string | undefined);

  return (
    <header /* ... */ >
      {/* ... Logo ... */}
      <nav className="flex items-center gap-2 sm:gap-4">
        {isSessionLoading ? ( // Use session-specific loading for the main button block
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        ) : hasActiveSession ? ( // Basic check for session existence
          <>
            <span className="text-sm text-foreground hidden sm:inline">
              Hi, {getDisplayName()} {/* Uses profile if available, falls back */}
            </span>
            <Avatar className="h-8 w-8 text-sm">
              <AvatarImage src={avatarUrl || undefined} alt={getDisplayName()} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <form action={signOutUserAction}>
              <Button variant="ghost" type="submit" size="sm">Sign Out</Button>
            </form>
            <Button variant="secondary" asChild size="sm">
              <Link href="/profile">Profile</Link>
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" asChild size="sm">
              <Link href="/login">Login</Link>
            </Button>
            <Button variant="default" asChild size="sm">
              <Link href="/register">Sign Up</Link>
            </Button>
          </>
        )}
      </nav>
    </header>
  );
}
```

## II. Global Client-Side State (Zustand)

The role of Zustand (`src/stores/auth.store.ts`) is now focused on **minimal, purely client-side global state that is NOT directly tied to auth session or server-fetched profile data.**

*   **Examples**:
    *   UI preferences (e.g., theme: light/dark/system).
    *   Global application toggles (e.g., "is sidebar open by default", "show advanced features").
    *   State for transient UI elements not managed by URL or local component state.
*   **Why not for core auth?** The combination of React Context (`AuthSessionProvider`) for the raw session and TanStack Query for profile data (composed by the `useAuth` hook) provides a more specialized and robust solution for async server state and session lifecycle management.
*   **Structure**: If you use Zustand for other global state, organize it into "slices."
    ```typescript
    // Example structure in src/stores/auth.store.ts (consider renaming to global.store.ts or similar)
    import { create } from 'zustand';

    interface GlobalSettingsState {
      theme: 'light' | 'dark' | 'system';
      actions: {
        setTheme: (theme: 'light' | 'dark' | 'system') => void;
      };
    }

    export const useGlobalSettingsStore = create<GlobalSettingsState>((set) => ({
      theme: 'system', // Default theme
      actions: {
        setTheme: (theme) => set({ theme }),
      },
    }));
    ```

## III. Data Fetching for Other Features (TanStack Query)

When building new features that require data from the server (e.g., a dashboard, list of items):

1.  **Zod Schema (`src/features/[your-feature]/schemas/[your-feature].schema.ts`):**
    *   Define the expected data shape using Zod.

2.  **Service Function (`src/features/[your-feature]/services/[your-feature].service.ts`):**
    *   Marked with `'use server';`.
    *   Contains direct Supabase (or other API) calls using the server client (`@/lib/supabase/server`).
    *   Handles data retrieval and basic transformation. Returns `{ data, error }`.
    *   Example: `fetchDashboardItemsForUser(userId: string)` could be a service.

3.  **Server Action (Query Function - `src/features/[your-feature]/queries/[your-feature].queries.ts`):**
    *   Marked with `'use server';`.
    *   Called by TanStack Query's `queryFn` on the client.
    *   Authenticates the user if necessary (e.g., `await supabase.auth.getUser()` or rely on middleware).
    *   Calls the appropriate service function (e.g., `await fetchDashboardItemsForUser(user.id)`).
    *   Can perform additional server-side logic or data validation (using Zod schemas).
    *   Returns the validated data or throws an error if fetching/validation fails, which `useQuery` will catch.
    *   Example: `async function getDashboardData(): Promise<DashboardItem[]> { /* ... */ }`.

4.  **Custom Hook with `useQuery` (`src/features/[your-feature]/hooks/use-[your-data]-query.ts`):**
    *   Client-side hook (`'use client'`).
    *   Uses `useQuery` from TanStack Query.
    *   `queryKey`: Unique key for the query, often including dynamic parts like `userId`.
    *   `queryFn`: The Server Action created in the step above.
    *   `enabled`: Conditional logic (e.g., only fetch if user is authenticated via `useAuth().user?.id` and `!useAuth().isSessionLoading`).
    *   Configures `staleTime`, `gcTime`, etc., as needed.

5.  **UI Component (`src/features/[your-feature]/components/[your-component].tsx`):**
    *   Uses the custom hook to get data, loading states, and error states.
    *   Renders UI based on these states (loading indicators, error messages, actual data).

**Example: `DashboardDisplay` (Conceptual)**
```tsx
// src/features/dashboard/components/dashboard-display.tsx (Conceptual)
'use client';

import { useQuery } from '@tanstack/react-query';
import { getDashboardData } from '@/features/dashboard/queries'; // Server Action
import { useAuth } from '@/features/auth/hooks';
import { Skeleton, Card /* ... */ } from '@/components/ui';
// import type { DashboardItem } from '@/features/dashboard/schemas'; // Type for dashboard items

export function DashboardDisplay() {
  const { user, isSessionLoading } = useAuth(); // Use session-specific loading for enabling query

  const {
    data: dashboardItems,
    isLoading: dataIsLoading, // This is specific to the dashboard data query
    isError,
    error,
  } = useQuery<any[], Error>({ // Replace 'any[]' with your DashboardItem[] type
    queryKey: ['dashboardData', user?.id],
    queryFn: async () => getDashboardData(), // Server Action call
    enabled: !isSessionLoading && !!user?.id, // Enable after session check and if user object exists
  });

  if (isSessionLoading) return <p>Authenticating session...</p>;
  if (!user && !isSessionLoading) return <p>Please log in to view the dashboard.</p>;

  // At this point, session is resolved. Now check dashboard data loading.
  if (dataIsLoading) return <Skeleton className="h-40 w-full" />; // Skeleton for dashboard content
  if (isError) return <p>Error loading dashboard: {error?.message}</p>;

  return (
    <Card>
      {/* Render dashboardItems */}
    </Card>
  );
}
```

## Conclusion

This refined approach to state management and data fetching leverages the strengths of each tool:
*   **React Context (`AuthSessionProvider`)**: For efficient, reactive propagation of the raw Supabase session and its basic loading state.
*   **TanStack Query**: For robust server state management (fetching, caching, background updates) for detailed user profiles and all other application data.
*   **`useAuth` Hook**: For a clean, unified, and granular API for components to access comprehensive authentication state, including the stricter `isAuthenticated` and composite `isLoadingAuth`.
*   **Zustand**: For managing other global, client-side UI state that doesn't involve server data.

This architecture promotes separation of concerns, maintainability, and scalability.

    