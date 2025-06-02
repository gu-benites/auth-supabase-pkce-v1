is # Authentication State and User Data Fetching

This document outlines the architecture and guidelines for managing authentication state and fetching user profile data in the application. It details the roles of React Context, TanStack Query, the composite `useAuth` hook, and Zustand in this process.

## 1. Architecture Overview

The application employs a layered approach to handle authentication and user data:

*   **React Context (`AuthSessionProvider`):** Provides the raw Supabase session and initial session loading state.
*   **TanStack Query:** Manages fetching, caching, and synchronizing server state, specifically the detailed user profile from the `profiles` table.
*   **Composite `useAuth` Hook:** Combines the raw session state and the fetched user profile data into a single, convenient hook for client components.
*   **Zustand:** Reserved for minimal, purely client-side global state not directly tied to authentication or server-fetched user data (e.g., UI preferences).

This structure ensures a clear separation of concerns:

*   `src/features/auth`: Focuses on the core authentication lifecycle (login, logout, registration, password reset).
*   `src/features/user-auth-data`: Manages the application-specific user profile data stored in the database.

## 2. Core Authentication (`src/features/auth`)

This feature handles the primary authentication workflows:

*   **Actions (`src/features/auth/actions/auth.actions.ts`):** Server Actions for authentication operations (e.g., `signInWithPassword`, `signUpNewUser`, `requestPasswordReset`, `updateUserPassword`, `signOutUserAction`). Client components should use these actions to initiate authentication flows.
*   **Components (`src/features/auth/components/*.tsx`):** UI components for authentication forms (Login, Register, Forgot Password, Reset Password).
*   **Services (`src/features/auth/services/auth.service.ts`):** Low-level server-side functions interacting directly with the Supabase Auth client.
*   **Utilities (`src/features/auth/utils/middleware.utils.ts`):** Handles session refreshing and route protection in the Next.js middleware.
*   **Schemas (`src/features/auth/schemas/*.ts`):** Zod schemas for validating authentication-related input.

## 3. User Profile Data (`src/features/user-auth-data`)

This feature is responsible for the data stored in the `profiles` table, associated with the authenticated user:

*   **Schemas (`src/features/user-auth-data/schemas/profile.schema.ts`):** Defines the structure and validation for the `UserProfile` type.
*   **Services (`src/features/user-auth-data/services/profile.service.ts`):** Server-side function (`getProfileByUserId`) to fetch profile data from the database.
*   **Queries (`src/features/user-auth-data/queries/profile.queries.ts`):** Server Action (`getCurrentUserProfile`) acting as the `queryFn` for fetching the current user's profile via TanStack Query.
*   **Actions (`src/features/user-auth-data/actions/profile.actions.ts`):** Server Action (`updateUserProfile`) to handle updates to the user's profile data, including file uploads (avatar, banner).
*   **Hooks (`src/features/user-auth-data/hooks/use-user-profile-query.ts`):** Client-side hook utilizing TanStack Query (`useQuery`) to fetch and manage the caching of the `UserProfile` data.

## 4. Integration: The `useAuth` Hook

The `useAuth` hook (`src/features/auth/hooks/use-auth.ts`) is the primary interface for client components needing access to comprehensive authentication and user data. It orchestrates the following:

1.  **Consumes Raw Session:** It reads the raw Supabase `User` and session loading/error states from the `AuthSessionProvider` (React Context).
2.  **Fetches Profile Data:** It calls `useUserProfileQuery` to fetch the detailed `UserProfile` data from the server via TanStack Query. TanStack Query handles caching, revalidation, and providing loading/error states for the profile data.
3.  **Combines States:** It combines the session state and profile data state to provide a unified view:
    *   `user`: The raw Supabase `User` object.
    *   `profile`: The detailed `UserProfile` object (from the database).
    *   `authUser`: A combined object containing properties from both `user` and `profile`, available when both session and profile are successfully loaded.
    *   `isAuthenticated`: A boolean indicating if a session exists *and* the profile data has been successfully loaded. This is a stricter check than just the session.
    *   `isLoadingAuth`: A composite boolean indicating if either the session or the profile data is currently loading.
    *   `isSessionLoading`: Loading state specifically from the `AuthSessionProvider`.
    *   `sessionError`: Error specifically from the `AuthSessionProvider`.
    *   `isProfileLoading`: Loading state specifically from the `useUserProfileQuery` hook.
    *   `profileError`: Error specifically from the `useUserProfileQuery` hook.

## 5. Guidelines on Usage

*   **For Authentication State and User Profile Data:** Always use the `useAuth` hook (`@/features/auth/hooks/use-auth.ts`) in client components that need information about the authenticated user or their profile (`user`, `profile`, `authUser`, `isAuthenticated`, `isLoadingAuth`, etc.). This hook provides the most comprehensive and correctly managed state.
*   **For Authentication Actions:** Use the Server Actions from `src/features/auth/actions/auth.actions.ts` (e.g., `signInWithPassword`, `signOutUserAction`) to perform authentication operations.
*   **For User Profile Actions:** Use the Server Action `updateUserProfile` from `src/features/user-auth-data/actions/profile.actions.ts` to update the user's profile information.
*   **Server-Side Data Fetching (Layouts/Pages):** For data critical to the initial render of a page or layout for an authenticated user (like the `userProfile`), utilize server-side prefetching with TanStack Query in async Server Components and hydrate on the client using `<HydrationBoundary>`. Refer to examples in `src/app/(dashboard)/layout.tsx` or `src/app/page.tsx`.
*   **Client-Side Data Fetching (Other Features):** For fetching other types of server data within client components, follow the pattern established for `useUserProfileQuery`: define a Zod schema, a server service, a server action (`queryFn`), and a client-side hook using `useQuery`.
*   **Minimal Client-Side Global State:** Reserve Zustand (`src/stores/auth.store.ts`) for client-side state that is not dependent on authentication or server data (e.g., UI toggles, temporary local state). Avoid storing authentication status or user profile data directly in Zustand.

By adhering to these guidelines, the application maintains a clear, efficient, and scalable approach to managing authentication and user data.