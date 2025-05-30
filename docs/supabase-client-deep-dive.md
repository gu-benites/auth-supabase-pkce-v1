
# Supabase Client Deep Dive: Initialization & Usage in Next.js

This document provides a comprehensive guide to understanding how Supabase client instances are initialized and utilized within this Next.js project, particularly focusing on the differences between client-side and server-side contexts, the role of middleware, and the interaction with Server Actions and Services.

## Core Concepts

1.  **Environment Variables:** Supabase requires two key environment variables:
    *   `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL.
    *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase project's anonymous (public) key.
    These are typically stored in an `.env.local` file and are prefixed with `NEXT_PUBLIC_` to be accessible on the client-side as well.

2.  **`@supabase/ssr` Package:** This package is specifically designed for server-side rendering (SSR) and static site generation (SSG) frameworks like Next.js. It helps manage user sessions by handling cookies securely on the server.

3.  **Client Types:**
    *   **Browser Client:** Used in Client Components (`'use client'`) for direct interactions from the user's browser. Created by `createBrowserClient` from `@supabase/ssr`.
    *   **Server Client:** Used in Server Components, Route Handlers, Server Actions (`'use server'`), and Service files for operations that need to occur on the server, often involving cookie management for sessions. Created by `createServerClient` from `@supabase/ssr`.

## Supabase Client Initialization Files

*   **Location:** `/src/lib/supabase/`
*   **Responsibility:** To provide standardized functions for creating Supabase client instances tailored for either client-side or server-side use.
*   **Important Note on Imports:** Always import the correct client creation function *directly* from its specific file (`client.ts` or `server.ts`) rather than through a barrel file that might cause confusion for the Next.js build process regarding server-only code.

### 1. `/src/lib/supabase/client.ts`

*   **Purpose:** To create a Supabase client instance intended for use in the **browser (Client Components)**.
*   **Code:**
    ```typescript
    // src/lib/supabase/client.ts
    import { createBrowserClient } from '@supabase/ssr';

    export function createClient() { // This is the browser client
      return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
    }
    ```
*   **Explanation:**
    *   Uses `createBrowserClient` from `@supabase/ssr`. This function is optimized for client-side environments.
    *   It directly accesses environment variables because it runs in the browser where `process.env.NEXT_PUBLIC_*` variables are available.
    *   This client does not handle cookie storage/retrieval itself; that's managed by Supabase's JS library interacting with the browser's cookie store.
    *   The `createClient` function here is **synchronous**.
*   **When to Use:** Import and call `createClient()` from this file in any Client Component (`'use client'`) or client-side utility that needs to interact with Supabase *without* server-side cookie management.
    *   **Example (`AuthSessionProvider`):**
        ```typescript
        // src/providers/auth-session-provider.tsx
        'use client';
        import { createClient } from '@/lib/supabase/client'; // Direct import
        import { useState, useEffect, createContext /* ... */ } from 'react';

        // ...
        const [supabaseClient] = useState(() => createClient()); // Stable instance
        // ...
        ```

### 2. `/src/lib/supabase/server.ts`

*   **Purpose:** To create a Supabase client instance intended for use on the **server (Server Components, Route Handlers, Server Actions, Service files)**. This client is crucial for managing authentication sessions via cookies.
*   **Code:**
    ```typescript
    // src/lib/supabase/server.ts
    "use server"; // Ensures this module and its functions are server-only

    import { createServerClient, type CookieOptions } from '@supabase/ssr';
    import { cookies } from 'next/headers';

    export async function createClient() { // This is the server client, note: async function
      const cookieStore = cookies(); // Access cookies using Next.js's server-only 'cookies()'

      return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
              try {
                cookiesToSet.forEach(({ name, value, options }) =>
                  cookieStore.set(name, value, options)
                );
              } catch {
                // The `setAll` method was called from a Server Component.
                // This can be ignored if you have middleware refreshing user sessions.
              }
            },
            remove(name: string, options: CookieOptions) { // Ensure remove is also handled
              try {
                cookieStore.set(name, '', { ...options, path: '/' });
              } catch {
                // Same as setAll, ignore if called from Server Component and middleware handles it
              }
            }
          },
        }
      );
    }
    ```
*   **Explanation:**
    *   **`"use server";`**: This directive at the top of the file is critical. It marks the entire module as server-only.
    *   Uses `createServerClient` from `@supabase/ssr`.
    *   **`async function createClient()`**: The function is `async` because `cookies()` (which provides access to the request's cookies) can only be called in an async context or specific server-side entry points. Therefore, any code calling this `createClient` function **must `await` it**.
    *   **Cookie Management:** The `cookies` option passed to `createServerClient` is vital. It tells the Supabase client how to read and write cookies using Next.js's server-side cookie store.
*   **When to Use:**
    *   **Server Actions (e.g., in `src/features/auth/actions/auth.actions.ts`):** These actions often call service functions.
    *   **Service Files (e.g., `src/features/auth/services/auth.service.ts`):**
        ```typescript
        // src/features/auth/services/auth.service.ts
        'use server'; // Mark service files as server-only
        import { createClient } from '@/lib/supabase/server'; // Direct import

        export async function signInWithPasswordWithSupabase(credentials) {
          const supabase = await createClient(); // MUST await
          return supabase.auth.signInWithPassword(credentials);
        }
        ```
    *   **Route Handlers (e.g., `src/app/(auth)/auth/confirm/route.ts`):**
        ```typescript
        // src/app/(auth)/auth/confirm/route.ts
        import { createClient } from '@/lib/supabase/server'; // Direct import
        // ...

        export async function GET(request: NextRequest) {
          const supabase = await createClient(); // MUST await
          // ... logic using supabase.auth ...
        }
        ```
    *   **Server Components (for data fetching directly):**
        ```typescript
        // Example Server Component
        import { createClient } from '@/lib/supabase/server'; // Direct import

        export default async function MyServerComponent() {
          const supabase = await createClient(); // MUST await
          const { data: { user } } = await supabase.auth.getUser();
          // ... render UI based on user ...
        }
        ```

## The Role of Middleware (`src/middleware.ts` and `src/features/auth/utils/middleware.utils.ts`)

*   **Purpose:** Middleware runs on the server before a request is processed for matching paths. In this project, it's used for **session management and route protection**.
*   **Structure:**
    *   `src/middleware.ts`: A lean entry point that calls `updateSession` from `src/features/auth/utils/middleware.utils.ts`.
    *   `src/features/auth/utils/middleware.utils.ts`: Contains the `updateSession` function which:
        *   Creates a Supabase server client instance using `createServerClient` (similar to `/src/lib/supabase/server.ts`), configuring cookie handling based on the incoming `request` and the outgoing `response`.
        *   **`await supabase.auth.getUser()`**: This is the most critical line for auth. It attempts to get the current session and user. If the access token is expired but a valid refresh token exists, Supabase will automatically refresh the session and update the cookies. The `setAll` function within the `cookies` config ensures these new session cookies are attached to the `response`.
        *   Implements route protection: Redirects unauthenticated users to `/login` if they try to access non-public paths.
*   This setup ensures that subsequent Server Components, Route Handlers, Server Actions, or Service calls in the same request lifecycle receive the most up-to-date session information and user object.

## Why the Separation and Directives?

1.  **Security:** Server Actions (`'use server'`) and server-side `createClient` prevent exposing sensitive operations or keys to the browser. Cookie handling must happen on the server to be secure.
2.  **Next.js Architecture:**
    *   **`'use client'`**: Required for components that use React Hooks (`useState`, `useEffect`) or browser-specific APIs. The Supabase browser client (from `src/lib/supabase/client.ts`) is suitable here.
    *   **`'use server'`**:
        *   For Server Actions (e.g., `auth.actions.ts`): Marks functions that execute exclusively on the server, callable from client components. These actions need the server client (often via services) to interact with Supabase and manage sessions.
        *   For Service files (e.g., `auth.service.ts`): If they are intended to be part of the server-only boundary and use server-only features (like the server Supabase client), they should also be marked with `'use server';`.
        *   For modules like `src/lib/supabase/server.ts`: If a module uses server-only APIs like `cookies()` from `next/headers`, it *must* be marked with `'use server';`.
3.  **Session Integrity:** The `createServerClient` (from `@supabase/ssr`) used in `src/lib/supabase/server.ts` and in the middleware, coupled with the middleware's `getUser()` call, ensures that user sessions are correctly maintained and refreshed.

## Direct Imports for Clarity

*   **Client-side (`/src/lib/supabase/client.ts`):** Always import directly:
    `import { createClient } from '@/lib/supabase/client';`
*   **Server-side (`/src/lib/supabase/server.ts`):** Always import directly:
    `import { createClient } from '@/lib/supabase/server';`
*   The barrel file `src/lib/supabase/index.ts` has been correctly updated to only export client-side utilities, thus preventing confusion.

## Common Pitfalls for Junior Developers:

1.  **Forgetting `await`:**
    *   When calling `createClient()` from `/src/lib/supabase/server.ts` (because it's `async`).
    *   When calling any `async` Supabase method (e.g., `await supabase.auth.signInWithPassword(...)`).
2.  **Using the Wrong Client or Import Path:**
    *   Trying to use `createClient` from `/src/lib/supabase/server.ts` in a Client Component (will error due to `cookies()`).
    *   Trying to use `createClient` from `/src/lib/supabase/client.ts` in a Server Action/Service where server-side session/cookie management is needed (won't manage cookies correctly for SSR).
3.  **`'use server'` Misplacement or Omission:**
    *   Adding `'use server'` to files that don't export async functions (like Zod schema files).
    *   Forgetting `'use server'` in files containing Server Actions or Service files that should be server-only and use server-side utilities.
    *   Forgetting `'use server'` on `src/lib/supabase/server.ts` itself.
4.  **Middleware Configuration:** Not understanding that the middleware is essential for keeping sessions alive and for route protection.
5.  **`AuthSessionProvider` (`@/providers/auth-session-provider.tsx`):**
    *   This provider is responsible for initializing the client-side Supabase instance and listening to `onAuthStateChange`.
    *   It's crucial that the `supabaseClient` within this provider is instantiated correctly (e.g., using `useState(() => createClient())` from `@/lib/supabase/client`) to ensure a stable instance across renders.
    *   Components relying on client-side auth state (like those using the `useAuth` hook) depend on this provider working correctly.

By understanding these distinctions and following the patterns in this project, developers can confidently work with Supabase authentication in a Next.js App Router environment.
