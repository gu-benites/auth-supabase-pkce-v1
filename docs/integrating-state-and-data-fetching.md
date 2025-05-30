
# Integrating State and Data Fetching (Context, TanStack Query, Zustand)

This document outlines the recommended approach for managing state and fetching data in this Next.js project, particularly focusing on authentication state, user profile data, and global client-side state. We leverage React Context, TanStack Query (React Query), and Zustand for distinct purposes to create a robust and scalable architecture.

## Core Principles:

1.  **Raw Session State (React Context):** The `AuthSessionProvider` (`@/providers/auth-session-provider.tsx`) uses React Context to make the raw Supabase user session (`User` object), initial session loading status, and session-related errors available to its children. This is the foundational layer for knowing if a Supabase session exists.
2.  **Server State & Data Fetching (TanStack Query):** TanStack Query is the primary tool for fetching, caching, and synchronizing server state. This includes detailed user profiles and any other data retrieved from your backend (Supabase).
3.  **Composite Auth State Hook (`useAuth`):** The `useAuth` hook (`@/features/auth/hooks/use-auth.ts`) acts as the main interface for client components to access comprehensive authentication information. It consumes the raw session from `AuthSessionProvider` and fetches the detailed user profile using TanStack Query (via `useUserProfileQuery`).
4.  **Minimal Global Client-Side State (Zustand):** Zustand (`@/stores/auth.store.ts`) is reserved for global client-side state that is *not* directly tied to server data or core authentication sessions (e.g., UI preferences, theme settings). Its role in direct auth state management has been minimized.

## I. Authentication State Management

Client components should primarily use the `useAuth` hook to get information about the current user and their authentication status.

### 1. `AuthSessionProvider` (React Context - `src/providers/auth-session-provider.tsx`)
*   **Purpose:** Provides the raw Supabase `User` object and tracks the initial loading state of the Supabase session.
*   **Implementation:**
    *   Client Component (`'use client'`).
    *   Uses the Supabase browser client (`@/lib/supabase/client`).
    *   Initializes a Supabase `onAuthStateChange` listener to reactively update the `user` object.
    *   Exposes `{ user: User | null, isLoading: boolean, error: Error | null }` via React Context.
    *   `isLoading` here specifically refers to the process of determining the initial session state.
*   **Usage:** Wrapped around the root layout in `src/app/layout.tsx`.

### 2. `useUserProfileQuery` (TanStack Query Hook - `src/features/profile/hooks/use-user-profile-query.ts`)
*   **Purpose:** Fetches the detailed user profile data from the backend.
*   **Implementation:**
    *   Client-side hook (`'use client'`).
    *   Uses TanStack Query's `useQuery`.
    *   `queryKey`: `['userProfile', userId]` (dynamically uses the authenticated user's ID).
    *   `queryFn`: Calls the `getCurrentUserProfile` Server Action (`@/features/profile/queries/profile.queries.ts`), which in turn calls a service function to fetch data from your `profiles` table (and merges with `auth.users` data like email).
    *   `enabled`: Typically enabled only when a user ID is available (i.e., user is authenticated).
    *   Manages its own loading, error, and data states for the profile fetching operation.
*   **Schema**: Uses `UserProfileSchema` from `@/features/profile/schemas/profile.schema.ts` for data shape.

### 3. `useAuth` Hook (Composite Hook - `src/features/auth/hooks/use-auth.ts`)
*   **Purpose:** Provides a unified and convenient way for components to access all relevant authentication and user information.
*   **Implementation:**
    *   Client-side hook (`'use client'`).
    *   Consumes `AuthSessionContext` (via `useAuthSession()`) to get the raw `user`, `isSessionLoading`, and `sessionError`.
    *   Calls `useUserProfileQuery()` to get the `profile` data and its associated loading/error states.
    *   **Combines these states**:
        *   `user`: The raw Supabase user object.
        *   `profile`: The detailed user profile data (from TanStack Query).
        *   `isAuthenticated`: Boolean derived from `!!user`.
        *   `isLoading`: Composite boolean (true if session is loading OR profile is loading when authenticated).
        *   `error`: Composite error (prioritizes session error, then profile error if authenticated).
        *   `isSessionLoading`: Boolean reflecting only the session provider's loading state.
        *   `sessionError`: Error object reflecting only session provider errors.
*   **Usage:** This is the **recommended hook** for most client components needing auth information.

**Example: `HomepageHeader` using the new `useAuth` hook**
```tsx
// src/features/homepage/components/header.tsx
'use client';

import Link from 'next/link';
import { PassForgeLogo } from '@/components/icons';
import { Loader2, UserCircle2 } from 'lucide-react';
import { Button, Avatar, AvatarFallback, AvatarImage } from '@/components/ui';
import { signOutUserAction } from '@/features/auth/actions';
import { useAuth } from '@/features/auth/hooks'; // The new composite hook

export function HomepageHeader(): JSX.Element {
  // isLoading reflects combined session and profile loading if user is present
  // isAuthenticated is true if session user exists
  const { user, profile, isAuthenticated, isLoading, error } = useAuth();

  const getDisplayName = () => {
    if (profile?.firstName) return profile.firstName;
    // @ts-ignore user_metadata exists but TypeScript might not know its shape
    if (user?.user_metadata?.first_name) return user.user_metadata.first_name;
    if (user?.email) return user.email.split('@')[0];
    return 'User';
  };

  const getInitials = () => {
    const firstName = profile?.firstName || user?.user_metadata?.first_name;
    // @ts-ignore
    const lastName = profile?.lastName || user?.user_metadata?.last_name;
    const firstInitial = firstName?.[0] || '';
    const lastInitial = lastName?.[0] || '';
    const initials = `${firstInitial}${lastInitial}`.toUpperCase();
    return initials || <UserCircle2 size={18} />;
  };
  
  const avatarUrl = profile?.avatarUrl || user?.user_metadata?.avatar_url;

  return (
    <header className="py-4 px-6 md:px-8 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <PassForgeLogo className="h-8 w-8 text-primary group-hover:text-accent transition-colors" />
          <span className="text-xl font-semibold text-foreground group-hover:text-accent transition-colors">
            PassForge
          </span>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-4">
          {isLoading ? ( // Use composite isLoading
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          ) : isAuthenticated ? ( // Check isAuthenticated
            <>
              <span className="text-sm text-foreground hidden sm:inline">
                Hi, {getDisplayName()}
              </span>
              <Avatar className="h-8 w-8 text-sm">
                <AvatarImage src={avatarUrl} alt={getDisplayName()} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <form action={signOutUserAction} className="inline-flex">
                <Button variant="ghost" type="submit" size="sm">Sign Out</Button>
              </form>
              <Button variant="secondary" asChild size="sm">
                <Link href="/profile">Profile</Link> 
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild size="sm">
                <Link href="/auth/forgot-password">Request Reset</Link>
              </Button>
              <Button variant="ghost" asChild size="sm">
                <Link href="/auth/login">Login</Link>
              </Button>
              <Button variant="default" asChild size="sm">
                <Link href="/auth/register">Sign Up</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
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
*   **Why not for core auth?** The combination of React Context (`AuthSessionProvider`) for the raw session and TanStack Query for profile data (composed by `useAuth`) provides a more specialized and robust solution for async server state and session lifecycle management, aligning with React's newer patterns and the capabilities of these libraries.
*   **Structure**: If you use Zustand for other global state, consider organizing it into "slices" for maintainability, similar to the `GlobalSettingsState` example provided in `src/stores/auth.store.ts`.

```typescript
// Example structure in src/stores/auth.store.ts (now a misnomer, should be global.store.ts or similar)
import { create } from 'zustand';

interface GlobalSettingsState {
  theme: 'light' | 'dark' | 'system';
  actions: {
    setTheme: (theme: 'light' | 'dark' | 'system') => void;
  };
}

export const useGlobalSettingsStore = create<GlobalSettingsState>((set) => ({
  theme: 'system',
  actions: {
    setTheme: (theme) => set({ theme }),
  },
}));
```

## III. Data Fetching for Other Features (TanStack Query)

When building new features that require data from the server (e.g., a dashboard, list of items):

1.  **Service Function (`src/features/[your-feature]/services/[your-feature].service.ts`):**
    *   Marked with `'use server';`.
    *   Contains direct Supabase (or other API) calls using the server client (`@/lib/supabase/server`).
    *   Handles data retrieval and basic transformation. Returns data and error.
    *   Example: `fetchDashboardItemsForUser(userId: string)` from `docs/adding-new-features.md`.

2.  **Server Action (Query Function - `src/features/[your-feature]/queries/[your-feature].queries.ts`):**
    *   Marked with `'use server';`.
    *   Called by TanStack Query's `queryFn` on the client.
    *   Authenticates the user if necessary (`await supabase.auth.getUser()`).
    *   Calls the appropriate service function.
    *   Can perform additional server-side logic or data validation.
    *   Throws an error if data fetching fails, which `useQuery` will catch.
    *   Example: `getDashboardData()` from `docs/adding-new-features.md`.

3.  **Custom Hook with `useQuery` (`src/features/[your-feature]/hooks/use-[your-data]-query.ts`):**
    *   Client-side hook (`'use client'`).
    *   Uses `useQuery` from TanStack Query.
    *   `queryKey`: Unique key for the query, often including dynamic parts like `userId`.
    *   `queryFn`: The Server Action created in the step above.
    *   `enabled`: Conditional logic (e.g., only fetch if user is authenticated).
    *   Configures `staleTime`, `gcTime`, etc., as needed.

4.  **UI Component (`src/features/[your-feature]/components/[your-component].tsx`):**
    *   Uses the custom hook to get data, loading states, and error states.
    *   Renders UI based on these states (loading indicators, error messages, actual data).

**Example: `DashboardDisplay` (Conceptual, from `docs/adding-new-features.md`)**
```tsx
// src/features/dashboard/components/dashboard-display.tsx (Conceptual)
'use client';

import { useQuery } from '@tanstack/react-query';
import { getDashboardData } from '@/features/dashboard/queries'; // Server Action
import { useAuth } from '@/features/auth/hooks'; // To check auth status
import { Skeleton, Card /* ... */ } from '@/components/ui';
// import type { DashboardItem } from '@/features/dashboard/services'; // Type for dashboard items

export function DashboardDisplay() {
  const { user, isAuthenticated, isSessionLoading } = useAuth(); // isSessionLoading is for initial session check

  const {
    data: dashboardItems,
    isLoading: dataIsLoading,
    isError,
    error,
  } = useQuery<any[], Error>({ // Replace 'any[]' with your DashboardItem[] type
    queryKey: ['dashboardData', user?.id],
    queryFn: getDashboardData,
    enabled: isAuthenticated && !isSessionLoading && !!user?.id, // Enable after session check and if authenticated
  });

  if (isSessionLoading) return <p>Authenticating...</p>;
  if (!isAuthenticated) return <p>Please log in.</p>;
  if (dataIsLoading) return <Skeleton className="h-20 w-full" />;
  if (isError) return <p>Error: {error?.message}</p>;

  return (
    <Card>
      {/* Render dashboardItems */}
    </Card>
  );
}
```

## Conclusion

This refined approach to state management and data fetching leverages the strengths of each tool:
*   **React Context (`AuthSessionProvider`)**: For efficient, reactive propagation of the raw Supabase session.
*   **TanStack Query**: For robust server state management, caching, and background updates, especially for user profiles and other application data.
*   **`useAuth` Hook**: For a clean, unified API for components to access authentication state.
*   **Zustand**: For managing other global, client-side UI state that doesn't involve server data.

This architecture promotes separation of concerns, maintainability, and scalability.

