
# Supabase Client Deep Dive: Initialization & Usage in Next.js

This document provides a comprehensive guide to understanding how Supabase client instances are initialized and utilized within this Next.js project, particularly focusing on the differences between client-side and server-side contexts, the role of middleware, and the interaction with Server Actions and Services.

## Core Concepts

1.  **Environment Variables:** Supabase requires two key environment variables:
    *   `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL.
    *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase project's anonymous (public) key.
    These are typically stored in an `.env.local` file and are prefixed with `NEXT_PUBLIC_` to be accessible on the client-side as well.

2.  **`@supabase/ssr` Package:** This package is specifically designed for server-side rendering (SSR) and static site generation (SSG) frameworks like Next.js. It helps manage user sessions by handling cookies securely on the server.

3.  **Client Types:**
    *   **Browser Client:** Used in Client Components (`'use client'`) for direct interactions from the user's browser.
    *   **Server Client:** Used in Server Components, Route Handlers, Server Actions (`'use server'`), and Service files for operations that need to occur on the server, often involving cookie management for sessions.

## Supabase Client Initialization Files

*   **Location:** `/src/lib/supabase/`
*   **Responsibility:** To provide standardized functions for creating Supabase client instances tailored for either client-side or server-side use.

### 1. `/src/lib/supabase/client.ts`

*   **Purpose:** To create a Supabase client instance intended for use in the **browser (Client Components)**.
*   **Code:**
    ```typescript
    import { createBrowserClient } from '@supabase/ssr';

    export function createClient() {
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
*   **When to Use:** Import and call `createClient()` from this file in any Client Component (`'use client'`) that needs to interact with Supabase (e.g., for client-side checks like in `ResetPasswordForm`, or if using Zustand's `auth.store.ts` for `onAuthStateChange`).
    ```typescript
    // Example in a Client Component
    'use client';
    import { createClient } from '@/lib/supabase/client';
    import { useEffect, useState } from 'react';

    function UserProfile() {
      const supabase = createClient(); // Note: createClient from client.ts is synchronous
      const [user, setUser] = useState(null);

      useEffect(() => {
        const fetchUser = async () => {
          const { data: { user } } = await supabase.auth.getUser();
          // @ts-ignore
          setUser(user);
        };
        fetchUser();
      }, [supabase]);
      // ... render UI ...
    }
    ```

### 2. `/src/lib/supabase/server.ts`

*   **Purpose:** To create a Supabase client instance intended for use on the **server (Server Components, Route Handlers, Server Actions, Service files)**. This client is crucial for managing authentication sessions via cookies.
*   **Code:**
    ```typescript
    "use server"; // Ensures this module and its functions are server-only

    import { createServerClient, type CookieOptions } from '@supabase/ssr';
    import { cookies } from 'next/headers';

    export async function createClient() { // Note: async function
      const cookieStore = await cookies(); // Access cookies using Next.js's server-only 'cookies()'

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
                // This can be ignored if you have middleware refreshing
                // user sessions.
              }
            },
            remove(name: string, options: CookieOptions) { // Ensure remove is also handled
              try {
                cookieStore.set(name, '', options); // Common way to remove by setting empty value
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
    *   **`"use server";`**: This directive at the top of the file is critical. It marks the entire module as server-only. This ensures that code within this file, especially `cookies()` from `next/headers`, is only ever executed on the server.
    *   Uses `createServerClient` from `@supabase/ssr`.
    *   **`async function createClient()`**: The function is `async` because `cookies()` (which provides access to the request's cookies) must be `await`ed. This means any code calling this `createClient` function must also `await` it.
    *   **Cookie Management:** The `cookies` option passed to `createServerClient` is vital. It tells the Supabase client how to read and write cookies using Next.js's server-side cookie store.
        *   `getAll()`: Reads all cookies from the incoming request.
        *   `setAll()`: Sets cookies on the outgoing response. The `try...catch` block handles cases where `setAll` might be called in a context where response headers can't be set directly (like during the render of a Server Component), relying on middleware to handle session refreshes.
        *   `remove()`: Handles cookie removal.
*   **When to Use:**
    *   **Server Actions (e.g., in `src/features/auth/actions/auth.actions.ts`):**
        ```typescript
        'use server';
        import { createClient } from '@/lib/supabase/server'; // Direct import
        // ... other imports for schemas, services

        export async function signInWithPasswordAction(prevState: any, formData: FormData) {
          // ... validation logic ...
          // In the action, you'd typically call a service function.
          // The service function itself would use `await createClient()`.
          // Example: const result = await authService.signInWithPasswordWithSupabase(credentials);
          // If the action made direct Supabase calls:
          // const supabase = await createClient(); // MUST await
          // const { data, error } = await supabase.auth.signInWithPassword(credentials);
          // ...
        }
        ```
    *   **Service Files (e.g., `src/features/auth/services/auth.service.ts`):**
        ```typescript
        'use server'; // Mark service files as server-only
        import { createClient } from '@/lib/supabase/server'; // Direct import
        import type { SignInWithPasswordCredentials } from '@supabase/supabase-js';

        export async function signInWithPasswordWithSupabase(credentials: SignInWithPasswordCredentials) {
          const supabase = await createClient(); // MUST await
          return supabase.auth.signInWithPassword(credentials);
        }
        ```
    *   **Route Handlers (e.g., `src/app/(auth)/auth/confirm/route.ts`):**
        ```typescript
        import { createClient } from '@/lib/supabase/server'; // Direct import
        import { type NextRequest, NextResponse } from 'next/server';
        // ...

        export async function GET(request: NextRequest) {
          const supabase = await createClient(); // MUST await
          // ... logic using supabase.auth ...
        }
        ```
    *   **Server Components (for data fetching directly in the component):**
        ```typescript
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
    *   `src/middleware.ts`: A lean entry point that calls `updateSession`.
    *   `src/features/auth/utils/middleware.utils.ts`: Contains the `updateSession` function which:
        *   Creates a Supabase server client instance similarly to `/src/lib/supabase/server.ts`, configuring cookie handling based on the incoming `request` and the outgoing `response`.
        *   **`await supabase.auth.getUser()`**: This is the most critical line for auth. It attempts to get the current session and user. If the access token is expired but a valid refresh token exists, Supabase will automatically refresh the session and update the cookies. The `setAll` function within the `cookies` config ensures these new session cookies are attached to the `response`.
        *   Implements route protection: Redirects unauthenticated users to `/login` if they try to access non-public paths.
*   This setup ensures that subsequent Server Components, Route Handlers, Server Actions, or Service calls in the same request lifecycle receive the most up-to-date session information and user object.

## Why the Separation and Directives?

1.  **Security:** Server Actions (`'use server'`) and server-side `createClient` prevent exposing sensitive operations or keys to the browser. Cookie handling must happen on the server to be secure.
2.  **Next.js Architecture:**
    *   **`'use client'`**: Required for components that use React Hooks (`useState`, `useEffect`) or browser-specific APIs. The Supabase browser client (from `src/lib/supabase/client.ts`) is suitable here.
    *   **`'use server'`**:
        *   For Server Actions (e.g., `auth.actions.ts`): Marks functions that execute exclusively on the server, callable from client components. These actions need the server client (often via services) to interact with Supabase and manage sessions.
        *   For Service files (e.g., `auth.service.ts`): If they are intended to be part of the server-only boundary and use server-only features (like the server Supabase client), they should also be marked with `'use server';`. This ensures they are not accidentally bundled into client JavaScript.
        *   For modules like `src/lib/supabase/server.ts`: If a module uses server-only APIs like `cookies()` from `next/headers`, it *must* be marked with `'use server';` or be imported *only* by other server-only modules/components.
3.  **Session Integrity:** The `createServerClient` (from `@supabase/ssr`) used in `src/lib/supabase/server.ts` and in the middleware, coupled with the middleware's `getUser()` call, ensures that user sessions are correctly maintained and refreshed across server-rendered pages and API interactions.

## Import Strategy: Direct Imports Only

*   **Client-side (`/src/lib/supabase/client.ts`):** Always import directly:
    `import { createClient } from '@/lib/supabase/client';`
*   **Server-side (`/src/lib/supabase/server.ts`):** Always import directly:
    `import { createClient } from '@/lib/supabase/server';`
*   **Avoid Barrel Files for Supabase Clients:** We've removed `src/lib/supabase/index.ts` to prevent confusion and ensure the Next.js build process correctly distinguishes between client and server module usage.

## Common Pitfalls for Junior Developers:

1.  **Forgetting `await`:**
    *   When calling `createClient()` from `/src/lib/supabase/server.ts` (because it's `async`).
    *   When calling any `async` Supabase method (e.g., `await supabase.auth.signInWithPassword(...)`).
2.  **Using the Wrong Client:**
    *   Trying to use `createClient` from `/src/lib/supabase/server.ts` in a Client Component (will error due to `cookies()`).
    *   Trying to use `createClient` from `/src/lib/supabase/client.ts` in a Server Action/Service where server-side session/cookie management is needed (won't manage cookies correctly for SSR).
3.  **`'use server'` Misplacement or Omission:**
    *   Adding `'use server'` to files that don't export async functions (like Zod schema files).
    *   Forgetting `'use server'` in files containing Server Actions or Service files that should be server-only and use server-side utilities.
    *   Forgetting `'use server'` on `src/lib/supabase/server.ts` itself.
4.  **Middleware Configuration:** Not understanding that the middleware is essential for keeping sessions alive and for route protection. Forgetting the `await supabase.auth.getUser()` call in middleware can lead to stale sessions not being refreshed or route protection not working.
5.  **Import Paths:** Always use direct imports for Supabase client creation functions to avoid ambiguity.

By understanding these distinctions and following the patterns in this project, developers can confidently work with Supabase authentication in a Next.js App Router environment.

    