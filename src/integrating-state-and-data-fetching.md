
# Integrating Global State (Zustand) and Data Fetching (TanStack Query)

This document provides guidance on how to integrate global state management using Zustand and server state management using TanStack Query (React Query) with the existing Supabase authentication flow in this Next.js project. These integrations are common next steps for building more complex user experiences, such as displaying user-specific information globally or fetching data for dashboards.

## I. Global User State with Zustand (`useAuth` Hook)

Zustand is a small, fast, and scalable state-management solution. We can use it to create a global store for the authenticated user's information and status, accessible via a custom `useAuth` hook.

**Goal:** Create a `useAuth` hook that provides access to the current user object, their profile, and authentication status (e.g., loading, authenticated, unauthenticated) throughout the application.

### 1. Installation

If not already installed (though often added alongside UI libraries or for general state needs):
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
import { createClient } from '@/lib/supabase/client'; // Or your client-side Supabase instance

// Define a type for your user profile if you have one in Supabase
interface UserProfile {
  id: string;
  firstName?: string;
  lastName?: string;
  // Add other profile fields as needed
}

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: Error | null;
  actions: {
    setUserAndProfile: (user: User | null, profile?: UserProfile | null) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: Error | null) => void;
    clearAuth: () => void;
    fetchUserProfile: (userId: string) => Promise<void>;
  };
}

const supabase = createClient(); // Initialize client-side Supabase

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  isLoading: true, // Start with loading true to check initial session
  isAuthenticated: false,
  error: null,
  actions: {
    setUserAndProfile: (user, profile = null) => {
      set({
        user,
        profile: user ? profile : null, // Only set profile if user exists
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
        // If no userId, ensure profile is null
        set({ profile: null });
        return;
      }
      try {
        set({ isLoading: true });
        // Assuming you have a 'profiles' table keyed by user ID
        // and RLS policies are set up for users to read their own profile.
        const { data, error } = await supabase
          .from('profiles') // Replace 'profiles' with your actual table name
          .select('*')
          .eq('id', userId)
          .single();

        if (error) throw error;

        // Enrich the profile with data from user_metadata if needed
        const currentUser = get().user;
        const enrichedProfile: UserProfile = {
          id: userId,
          firstName: data?.first_name || currentUser?.user_metadata?.first_name,
          lastName: data?.last_name || currentUser?.user_metadata?.last_name,
          ...data, // Spread other fields from the profiles table
        };
        set({ profile: enrichedProfile, isLoading: false });
      } catch (e) {
        console.error('Error fetching user profile:', e);
        set({ error: e as Error, profile: null, isLoading: false });
      }
    },
  },
}));

// Helper to initialize and subscribe to auth changes
export function initializeAuthListener() {
  const { setUserAndProfile, clearAuth, fetchUserProfile } = useAuthStore.getState().actions;
  
  // Set initial loading state
  useAuthStore.setState({ isLoading: true });

  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session?.user) {
      setUserAndProfile(session.user);
      fetchUserProfile(session.user.id); // Fetch profile after setting user
    } else {
      clearAuth();
    }
    useAuthStore.setState({ isLoading: false }); // Update loading state after initial check
  });

  const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
    const user = session?.user ?? null;
    if (user) {
      setUserAndProfile(user);
      await fetchUserProfile(user.id); // Re-fetch profile on auth change
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
    profile: state.profile,
    isLoading: state.isLoading,
    isAuthenticated: state.isAuthenticated,
    error: state.error,
    actions: state.actions,
}));

```
*Note on `fetchUserProfile`: This is a conceptual example. You'll need a `profiles` table (or similar) in Supabase where user-specific data (like `first_name`, `last_name`, etc., beyond what's in `user_metadata`) is stored. Ensure RLS policies are in place for this table.*

### 3. Initializing the Auth Listener

To ensure the auth state is loaded and kept in sync, you should call `initializeAuthListener` once when your application mounts. A good place for this is in your root layout or a global provider component.

**Example in `src/app/layout.tsx` (or a dedicated client-side provider):**

```tsx
// src/app/layout.tsx (simplified example)
'use client'; // If initializing in layout directly, or use a client component provider

import { useEffect } from 'react';
import { initializeAuthListener } from '@/stores/auth.store'; // Adjust path as needed
// ... other imports

export default function RootLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const unsubscribe = initializeAuthListener();
    return () => unsubscribe(); // Cleanup listener on unmount
  }, []);

  return (
    <html lang="en">
      <body>
        {/* Your QueryClientProvider and other providers would also go here */}
        {children}
      </body>
    </html>
  );
}
```
Alternatively, create a dedicated client component provider:
```tsx
// src/components/providers/auth-state-provider.tsx
'use client';

import { useEffect } from 'react';
import { initializeAuthListener } from '@/stores/auth.store';

export function AuthStateProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const unsubscribe = initializeAuthListener();
    return () => unsubscribe();
  }, []);

  return <>{children}</>;
}
```
And use it in `src/app/layout.tsx`:
```tsx
// src/app/layout.tsx
import { AuthStateProvider } from '@/components/providers/auth-state-provider';
// ...
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode; }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <PHProvider> {/* Existing PostHog Provider */}
        <AuthStateProvider> {/* New AuthStateProvider */}
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

Now, you can use the `useAuth` hook in any client component to access user information:

```tsx
// Example in src/features/homepage/components/header.tsx
'use client';

import Link from 'next/link';
import { PassForgeLogo } from '@/components/icons';
import { Button } from '@/components/ui';
import { useAuth } from '@/stores/auth.store'; // Adjust path
import { Skeleton } from '@/components/ui'; // For loading state

export function HomepageHeader() {
  const { user, profile, isAuthenticated, isLoading, actions } = useAuth();
  const supabase = createClient(); // For sign out

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    actions.clearAuth(); // Clear auth state in Zustand store
    // Optionally redirect or show a toast
  };

  return (
    <header className="py-4 px-6 md:px-8 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between">
        {/* ... Logo ... */}
        <nav className="flex items-center gap-2 sm:gap-4">
          {isLoading ? (
            <>
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
            </>
          ) : isAuthenticated ? (
            <>
              <span className="text-sm text-foreground">
                Hi, {profile?.firstName || user?.email}
              </span>
              <Button variant="ghost" onClick={handleSignOut}>Sign Out</Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/forgot-password">Request Reset</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/(auth)/login">Login</Link>
              </Button>
              <Button variant="default" asChild>
                <Link href="/(auth)/register">Sign Up</Link>
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

TanStack Query is excellent for managing server state: fetching, caching, synchronizing, and updating data from your backend. It's already included in your `package.json` (`@tanstack/react-query`).

**Goal:** Securely fetch and display data in a dashboard component, respecting user authentication.

### 1. Setting up `QueryClientProvider`

Wrap your application (or the relevant part of it) with `QueryClientProvider`. A good place is `src/app/layout.tsx` or a custom provider component.

```tsx
// src/components/providers/query-provider.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'; // Optional
import React from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Global default query options
        staleTime: 1000 * 60 * 5, // 5 minutes
        refetchOnWindowFocus: false, // Optional
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} /> {/* Optional: for development */}
    </QueryClientProvider>
  );
}
```

Then use it in your `src/app/layout.tsx`:
```tsx
// src/app/layout.tsx
import { QueryProvider } from '@/components/providers/query-provider';
// ... other providers like AuthStateProvider, PHProvider ...

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode; }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <PHProvider>
        <QueryProvider> {/* TanStack Query Provider */}
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

### 2. Creating a Data Fetching Function (Server Action or Route Handler)

Your data fetching logic should reside on the server to securely interact with Supabase. This can be a Server Action or a traditional API Route Handler.

**Example: Server Action to fetch dashboard data**

Create a new file, e.g., `src/features/dashboard/queries/dashboard.queries.ts`:

```typescript
// src/features/dashboard/queries/dashboard.queries.ts
'use server';

import { createClient } from '@/lib/supabase/server'; // Use server client

export async function getDashboardData() {
  const supabase = await createClient(); // Ensures authenticated server client

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
    // Or return an empty/default state: return { items: [] };
  }

  // Example: Fetch items specific to the user
  // Ensure RLS policies on 'dashboard_items' table only allow users to see their own data.
  const { data, error } = await supabase
    .from('dashboard_items') // Replace with your actual table
    .select('*')
    .eq('user_id', user.id); // Filter by user ID

  if (error) {
    console.error('Error fetching dashboard data:', error);
    throw new Error('Failed to fetch dashboard data');
  }

  return data || [];
}
```
Remember to create a barrel file (`src/features/dashboard/queries/index.ts`) if you follow this pattern.

### 3. Using `useQuery` in a Dashboard Component

Create your dashboard component and use `useQuery` to fetch data.

**Example: `src/features/dashboard/components/dashboard-display.tsx`**

```tsx
// src/features/dashboard/components/dashboard-display.tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { getDashboardData } from '@/features/dashboard/queries'; // Adjust path
import { useAuth } from '@/stores/auth.store'; // To check authentication status easily
import { Skeleton } from '@/components/ui';

interface DashboardItem {
  id: string;
  name: string;
  // ... other properties
}

export function DashboardDisplay() {
  const { isAuthenticated, isLoading: authIsLoading } = useAuth();

  const { data: dashboardItems, isLoading: dataIsLoading, error } = useQuery<DashboardItem[], Error>({
    queryKey: ['dashboardData'], // Unique key for this query
    queryFn: getDashboardData,
    enabled: isAuthenticated && !authIsLoading, // Only fetch if authenticated and auth check is done
  });

  if (authIsLoading || (isAuthenticated && dataIsLoading)) {
    return (
      <div>
        <Skeleton className="h-8 w-full mb-4" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <p>Please log in to view your dashboard.</p>;
  }

  if (error) {
    return <p className="text-destructive">Error loading dashboard: {error.message}</p>;
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Your Dashboard Items</h2>
      {dashboardItems && dashboardItems.length > 0 ? (
        <ul>
          {dashboardItems.map((item) => (
            <li key={item.id} className="p-2 border-b">
              {item.name}
            </li>
          ))}
        </ul>
      ) : (
        <p>No items to display on your dashboard yet.</p>
      )}
    </div>
  );
}
```
You would then create a page like `src/app/dashboard/page.tsx` to render this `DashboardDisplay` component.

### Key Considerations for TanStack Query + Supabase:

*   **Row Level Security (RLS):** Crucial for ensuring users can only access their own data. All Supabase queries from server actions/route handlers must be made with an authenticated client so RLS policies are enforced.
*   **Client-Side Supabase Client for Mutations:** While `useQuery` fetches data through server-side functions, if you need to perform mutations (create, update, delete) directly from the client using TanStack Query's `useMutation`, ensure you use the client-side Supabase instance (`createClient()` from `@/lib/supabase/client`).
*   **Invalidation and Refetching:** Leverage TanStack Query's capabilities to invalidate queries and refetch data after mutations to keep the UI consistent.

## Conclusion

Integrating Zustand for global auth state and TanStack Query for server state management provides a robust and scalable architecture for your Next.js application.

*   **Zustand (`useAuth`)** gives you a reactive, global source of truth for the user's authentication status and profile, ideal for UI updates and conditional rendering.
*   **TanStack Query** simplifies data fetching, caching, and synchronization, making it easier to build data-intensive features like dashboards while respecting user authentication and Supabase RLS.

By following these patterns, new team members can quickly understand how to access user information and fetch data securely and efficiently. Remember to adapt the table names, profile structures, and data fetching logic to your specific application needs.
      