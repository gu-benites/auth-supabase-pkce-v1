
# Integrating Global State (Zustand) and Data Fetching (TanStack Query) v2

This document provides guidance on how to integrate global state management using Zustand and server state management using TanStack Query (React Query) with the existing Supabase authentication flow in this Next.js project. These integrations are common next steps for building more complex user experiences, such as displaying user-specific information globally or fetching data for dashboards.

## I. Global User State with Zustand (`useAuth` Hook)

Zustand is a small, fast, and scalable state-management solution. We can use it to create a global store for the authenticated user's information and status, accessible via a custom `useAuth` hook.

**Goal:** Create a `useAuth` hook that provides access to the current user object, their profile (if any), and authentication status (e.g., loading, authenticated, unauthenticated) throughout the application.

### 1. Installation

Zustand should be installed if not already present:
```bash
npm install zustand
# or
yarn add zustand
```

### 2. Creating the Auth Store

Create a new file, for example, `src/stores/auth.store.ts`:

```typescript
// src/stores/auth.store.ts
import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client'; // Client-side Supabase instance

// Define a type for your user profile if you have one in a separate Supabase table
// This is distinct from user_metadata which is simpler key-value data.
interface UserProfile {
  id: string; // Should match the auth.users.id
  username?: string;
  avatar_url?: string;
  // Add other profile fields from your 'profiles' table
}

interface AuthState {
  user: User | null;
  profile: UserProfile | null; // For data from a dedicated 'profiles' table
  isLoading: boolean;
  isAuthenticated: boolean;
  error: Error | null;
  actions: {
    setUserAndProfile: (user: User | null, profileData?: Partial<UserProfile> | null) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: Error | null) => void;
    clearAuth: () => void;
    fetchUserProfile: (userId: string) => Promise<void>;
  };
}

const supabase = createClient();

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  isLoading: true, // Start true to check initial session
  isAuthenticated: false,
  error: null,
  actions: {
    setUserAndProfile: (user, profileData = null) => {
      // Combine user_metadata (like first_name, last_name) with profileData from a 'profiles' table
      let combinedProfile: UserProfile | null = null;
      if (user) {
        combinedProfile = {
          id: user.id,
          // Prioritize data from a dedicated 'profiles' table if provided
          ...(profileData || {}),
          // Fallback or supplement with user_metadata if needed and not in profileData
          // Example: if 'firstName' isn't in your UserProfile from the table, but is in metadata
          // firstName: profileData?.firstName || user.user_metadata?.first_name,
          // lastName: profileData?.lastName || user.user_metadata?.last_name,
        };
      }

      set({
        user,
        profile: combinedProfile,
        isAuthenticated: !!user,
        isLoading: false,
        error: null,
      });
    },
    setLoading: (loading) => set({ isLoading: loading }),
    setError: (error) => set({ error, isLoading: false }),
    clearAuth: () => {
      set({
        user: null,
        profile: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    },
    fetchUserProfile: async (userId: string) => {
      if (!userId) {
        set({ profile: null }); // Clear profile if no user ID
        return;
      }
      try {
        set({ isLoading: true }); // Consider a separate profileLoading state if preferred

        // IMPORTANT: This assumes you have a 'profiles' table in Supabase
        // with RLS policies allowing users to read their own profile.
        // Create this table with columns like 'id' (matches auth.users.id), 'username', 'avatar_url', etc.
        const { data: profileData, error: profileError } = await supabase
          .from('profiles') // Replace 'profiles' with your actual table name
          .select('*')
          .eq('id', userId)
          .single();

        if (profileError && profileError.code !== 'PGRST116') { // PGRST116: 0 rows
            throw profileError;
        }

        // Get current user to potentially merge with user_metadata later if needed
        const currentUser = get().user;
        if (currentUser) {
          // Call setUserAndProfile to update both user and profile state
          // It handles merging user_metadata if your UserProfile type expects it
          get().actions.setUserAndProfile(currentUser, profileData as UserProfile | null);
        } else {
           set({ profile: profileData as UserProfile | null, isLoading: false });
        }

      } catch (e) {
        console.error('Error fetching user profile:', e);
        set({ error: e as Error, profile: null, isLoading: false });
      }
    },
  },
}));

// Helper to initialize and subscribe to auth changes
// This should be called once when the application mounts.
export function initializeAuthListener() {
  const { setUserAndProfile, clearAuth, fetchUserProfile } = useAuthStore.getState().actions;

  useAuthStore.setState({ isLoading: true }); // Set initial loading

  supabase.auth.getSession().then(async ({ data: { session } }) => {
    if (session?.user) {
      setUserAndProfile(session.user); // Set user first
      await fetchUserProfile(session.user.id); // Then fetch profile
    } else {
      clearAuth();
    }
    useAuthStore.setState({ isLoading: false });
  });

  const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
    const user = session?.user ?? null;
    useAuthStore.setState({ isLoading: true });
    if (user) {
      setUserAndProfile(user); // Set user first
      await fetchUserProfile(user.id); // Then fetch profile
    } else {
      clearAuth();
    }
    useAuthStore.setState({ isLoading: false });
  });

  return () => {
    authListener?.unsubscribe();
  };
}

// Custom hook for easy access to state and actions
export const useAuth = () => useAuthStore((state) => ({
    user: state.user,
    profile: state.profile, // Contains combined data if 'profiles' table is used
    isLoading: state.isLoading,
    isAuthenticated: state.isAuthenticated,
    error: state.error,
    actions: state.actions,
    // You can expose user_metadata directly if needed:
    // userMetadata: state.user?.user_metadata,
}));
```

**Note on `profiles` Table and `user_metadata`:**
*   `user_metadata` (e.g., `first_name`, `last_name` set during sign-up) is stored directly in `auth.users` and is good for simple, less frequently changing data.
*   A separate `profiles` table (e.g., with `id`, `username`, `avatar_url`) is better for more complex, mutable user profile data that you might want to query or update independently. **You need to create this table and set up RLS policies for it in Supabase.**
*   The `fetchUserProfile` example above assumes you have such a `profiles` table. Adjust as needed.

### 3. Initializing the Auth Listener

Call `initializeAuthListener` once when your application mounts. A client component provider is a clean way to do this.

**Create `src/components/providers/auth-state-provider.tsx`:**
```tsx
// src/components/providers/auth-state-provider.tsx
'use client';

import { useEffect } from 'react';
import { initializeAuthListener } from '@/stores/auth.store'; // Adjust path if needed

export function AuthStateProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const unsubscribe = initializeAuthListener();
    return () => unsubscribe(); // Cleanup listener on unmount
  }, []);

  return <>{children}</>;
}
```

**Use it in `src/app/layout.tsx`:**
```tsx
// src/app/layout.tsx
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster, PHProvider, DynamicPostHogPageview } from '@/components'; // Example using barrel files
import { AuthStateProvider } from '@/components/providers/auth-state-provider'; // New Provider

const geistSans = Geist(/* ... */);
const geistMono = Geist_Mono(/* ... */);

export const metadata = { /* ... */ };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode; }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <PHProvider> {/* Existing PostHog Provider */}
        <AuthStateProvider> {/* New AuthStateProvider (wraps children) */}
          <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
            <DynamicPostHogPageview />
            {children}
            <Toaster />
          </body>
        </AuthStateProvider>
      </PHProvider>
    </html>
  );
}
```

### 4. Using the `useAuth` Hook

Now, any client component can use `useAuth` to access authentication state and user/profile information.

```tsx
// Example in src/features/homepage/components/header.tsx (Client Component)
'use client';

import Link from 'next/link';
import { PassForgeLogo } from '@/components/icons';
import { Button, Skeleton } from '@/components/ui';
import { useAuth } from '@/stores/auth.store'; // Adjust path
import { createClient } from '@/lib/supabase/client';

export function HomepageHeader() {
  const { user, profile, isAuthenticated, isLoading, actions } = useAuth();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    // onAuthStateChange in auth.store.ts will handle clearing state
  };

  // Display name preference: profile.username -> user.user_metadata.first_name -> user.email
  const displayName = profile?.username || user?.user_metadata?.first_name || user?.email?.split('@')[0];

  return (
    <header /* ... */>
      <div className="container mx-auto flex items-center justify-between">
        {/* ... Logo ... */}
        <nav className="flex items-center gap-2 sm:gap-4">
          {isLoading ? (
            <>
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-20 rounded-md" />
            </>
          ) : isAuthenticated ? (
            <>
              <span className="text-sm text-foreground">
                Hi, {displayName}
              </span>
              <Button variant="ghost" onClick={handleSignOut}>Sign Out</Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/forgot-password">Request Reset</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button variant="default" asChild>
                <Link href="/register">Sign Up</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
```

## II. Data Fetching with TanStack Query (React Query)

TanStack Query excels at managing server state: fetching, caching, and updating data. It's in your `package.json` (`@tanstack/react-query`).

**Goal:** Securely fetch and display data in a dashboard component, respecting user authentication.

### 1. Setting up `QueryClientProvider`

Wrap your application with `QueryClientProvider`.

**Create `src/components/providers/query-provider.tsx`:**
```tsx
// src/components/providers/query-provider.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'; // Optional
import React from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // Create a new QueryClient instance for each session (on the client)
  // to avoid sharing data between users if prefetching on the server.
  const [queryClient] = React.useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* ReactQueryDevtools is recommended for development */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

**Update `src/app/layout.tsx` to include `QueryProvider`:**
```tsx
// src/app/layout.tsx (simplified)
import { AuthStateProvider } from '@/components/providers/auth-state-provider';
import { QueryProvider } from '@/components/providers/query-provider'; // New
// ... other imports

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode; }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <PHProvider>
        <QueryProvider> {/* TanStack Query Provider (can wrap AuthStateProvider or be sibling) */}
          <AuthStateProvider>
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
              <DynamicPostHogPageview />
              {children}
              <Toaster />
            </body>
          </AuthStateProvider>
        </QueryProvider>
      </PHProvider>
    </html>
  );
}
```

### 2. Creating a Data Fetching Function (Server Action)

Fetch data securely on the server using a Server Action.

**Example: `src/features/dashboard/queries/dashboard.queries.ts`**
```typescript
// src/features/dashboard/queries/dashboard.queries.ts
'use server';

import { createClient } from '@/lib/supabase/server'; // Server-side Supabase client

export interface DashboardItem { // Define a type for your items
  id: string;
  name: string;
  user_id: string;
  // ... other properties
}

export async function getDashboardData(): Promise<DashboardItem[]> {
  const supabase = await createClient(); // Use await for async createClient

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    // It's often better to return empty/default data or let TanStack Query handle the disabled state
    // rather than throwing an error that might be hard to catch gracefully in the UI.
    // throw new Error('User not authenticated');
    return [];
  }

  // IMPORTANT: This assumes you have a 'dashboard_items' table in Supabase
  // with RLS policies ensuring users can only see their own data (e.g., `auth.uid() = user_id`).
  const { data, error } = await supabase
    .from('dashboard_items') // Replace with your actual table name
    .select('*')
    .eq('user_id', user.id); // Filter by the authenticated user's ID

  if (error) {
    console.error('Error fetching dashboard data:', error);
    // You might want to throw a more specific error or return an error object
    throw new Error(`Failed to fetch dashboard data: ${error.message}`);
  }

  return data || [];
}
```
Remember to create `src/features/dashboard/queries/index.ts` to export this function.

### 3. Using `useQuery` in a Dashboard Component

**Example: `src/features/dashboard/components/dashboard-display.tsx`**
```tsx
// src/features/dashboard/components/dashboard-display.tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { getDashboardData, type DashboardItem } from '@/features/dashboard/queries'; // Adjust path
import { useAuth } from '@/stores/auth.store'; // To check authentication status
import { Skeleton, Card, CardHeader, CardTitle, CardContent } from '@/components/ui'; // Example UI components

export function DashboardDisplay() {
  const { isAuthenticated, isLoading: authIsLoading } = useAuth();

  // `useQuery` fetches data using the `getDashboardData` Server Action.
  const {
    data: dashboardItems,
    isLoading: dataIsLoading,
    isError,
    error,
    isFetching, // Useful for showing loading indicators on refetches
  } = useQuery<DashboardItem[], Error>({
    queryKey: ['dashboardData'], // Unique key for this query. Can include user ID if data is user-specific.
    queryFn: getDashboardData,
    // Only enable the query if the user is authenticated and initial auth check is done.
    enabled: isAuthenticated && !authIsLoading,
    // Other options like refetchInterval, onSuccess, onError can be configured here.
  });

  if (authIsLoading) {
    return <p>Authenticating...</p>; // Or a global loading spinner
  }

  if (!isAuthenticated) {
    return <p>Please log in to view your dashboard.</p>; // Or redirect to login
  }

  if (dataIsLoading) {
    return (
      <div>
        <h2 className="text-2xl font-semibold mb-4">Dashboard Items</h2>
        <Skeleton className="h-8 w-full mb-2" />
        <Skeleton className="h-8 w-full mb-2" />
        <Skeleton className="h-8 w-2/2" />
      </div>
    );
  }

  if (isError) {
    return <p className="text-destructive">Error loading dashboard: {error?.message || 'Unknown error'}</p>;
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          Your Dashboard Items
          {isFetching && <Skeleton className="h-5 w-5 rounded-full animate-ping" />}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {dashboardItems && dashboardItems.length > 0 ? (
          <ul className="space-y-2">
            {dashboardItems.map((item) => (
              <li key={item.id} className="p-3 border rounded-md shadow-sm hover:bg-muted/50">
                {item.name}
              </li>
            ))}
          </ul>
        ) : (
          <p>No items to display on your dashboard yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
```
You would then create a page like `src/app/dashboard/page.tsx` to render this `DashboardDisplay` component, potentially wrapping it in a layout that checks for authentication.

### Key Considerations:

*   **Row Level Security (RLS):** This is **critical**. Ensure your Supabase tables (`profiles`, `dashboard_items`, etc.) have RLS policies enabled so users can only access/modify their own data. Server Actions using the authenticated Supabase client will respect these policies.
*   **Supabase Client Instances**:
    *   Zustand store (client-side): Use `createClient()` from `@/lib/supabase/client`.
    *   TanStack Query `queryFn` (Server Actions): Use `await createClient()` from `@/lib/supabase/server`.
    *   TanStack Query `mutationFn` (if client-side): Use `createClient()` from `@/lib/supabase/client`. However, prefer Server Actions for mutations when possible.
*   **Invalidation and Refetching:** After mutations (e.g., adding a dashboard item via a Server Action), use `queryClient.invalidateQueries({ queryKey: ['dashboardData'] })` from TanStack Query to refetch data and keep the UI consistent.
*   **Error and Loading States**: Implement robust UI feedback for loading, error, and empty states.
*   **User Experience**: Think about how data fetching impacts UX. `enabled` flag in `useQuery` is good. Consider placeholders, optimistic updates for mutations, etc.

## Conclusion

Integrating Zustand for global auth state and TanStack Query for server state management provides a powerful and scalable architecture.
- **Zustand (`useAuth`)** offers a reactive, global source for user authentication status and profile.
- **TanStack Query** simplifies data fetching, caching, and synchronization for features like dashboards.
Remember to adapt table names, profile structures, and data fetching logic to your specific application needs and always prioritize security with RLS policies in Supabase.
