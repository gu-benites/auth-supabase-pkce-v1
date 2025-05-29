
# Implementation Plan: Aligning with Consultant Feedback for Auth & State

This document outlines the step-by-step plan to refactor the PassForge application's authentication and state management to align with the consultant's recommendations. The goal is to leverage React Context for raw session data, TanStack Query for fetching user profile data, and refine Zustand's role for minimal, purely client-side global state if needed.

## Phase 1: Refactor Core Auth State Management (useAuth Hook)

This phase focuses on restructuring how authentication state (session, user object, profile) is managed and accessed in client components.

### Task 1.1: Create AuthSessionProvider (React Context)
*   [ ] **Create `src/components/providers/auth-session-provider.tsx`**:
    *   This will be a Client Component (`'use client'`).
    *   It will use the Supabase browser client (`@/lib/supabase/client.ts`).
    *   It will initialize a Supabase `onAuthStateChange` listener.
    *   It will provide the raw Supabase `User` object and an `isLoading` state (for the initial session check and auth changes) via React Context.
    *   **Context Value**: `{ user: User | null, isLoading: boolean, error: Error | null }`
    *   **Responsibility**: Make the raw Supabase user session and its loading status available to its children.

### Task 1.2: Update Root Layout
*   [ ] **Modify `src/app/layout.tsx`**:
    *   Remove the existing `AuthStateProvider` (which uses Zustand).
    *   Wrap the application with the new `AuthSessionProvider`.

### Task 1.3: Create Service and Query for User Profile
*   [ ] **Define `UserProfile` Schema**:
    *   Ensure `src/features/profile/schemas/profile.schema.ts` accurately defines the `UserProfile` type. This schema should represent the data fetched for a user profile, combining information from `auth.users` and your `profiles` table.
        ```typescript
        // src/features/profile/schemas/profile.schema.ts
        import { z } from 'zod';

        export const UserProfileSchema = z.object({
          id: z.string().uuid().describe("User's unique identifier, matches auth.users.id"),
          email: z.string().email().optional().nullable().describe("User's email address from auth.users"),
          firstName: z.string().optional().nullable().describe("User's first name"),
          lastName: z.string().optional().nullable().describe("User's last name"),
          gender: z.string().optional().nullable().describe("User's gender"),
          ageCategory: z.string().optional().nullable().describe("User's age category"),
          specificAge: z.number().int().optional().nullable().describe("User's specific age"),
          language: z.string().optional().nullable().default('en').describe("User's preferred language, defaults to 'en'"),
          avatarUrl: z.string().url().optional().nullable().describe("URL of the user's avatar image"),
          role: z.enum(['user', 'premium', 'admin']).default('user').describe("User's role within the application"),
          stripeCustomerId: z.string().optional().nullable().describe("User's Stripe customer ID, if applicable"),
          subscriptionStatus: z.string().optional().nullable().describe("Status of the user's subscription"),
          subscriptionTier: z.string().optional().nullable().describe("Tier of the user's subscription"),
          subscriptionPeriod: z.enum(['monthly', 'annual']).optional().nullable().describe("Billing period of the subscription"),
          subscriptionStartDate: z.string().datetime({ offset: true }).optional().nullable().describe("Start date of the current subscription period"),
          subscriptionEndDate: z.string().datetime({ offset: true }).optional().nullable().describe("End date of the current subscription period"),
          createdAt: z.string().datetime({ offset: true }).describe("Timestamp of when the profile was created"),
          updatedAt: z.string().datetime({ offset: true }).describe("Timestamp of the last profile update"),
        });

        export type UserProfile = z.infer<typeof UserProfileSchema>;
        ```
*   [ ] **Create `getProfileByUserId` Service**:
    *   Ensure `src/features/profile/services/profile.service.ts` has a function `getProfileByUserId(userId: string): Promise<{ data: UserProfile | null; error: Error | null }>` (or similar) that fetches data from the `profiles` table and merges it with relevant data from `auth.users` (like email). This service uses the server Supabase client. It should select all relevant fields from your `profiles` table as defined in the schema above.
*   [ ] **Create `getCurrentUserProfile` Server Action (Query Function for TanStack Query)**:
    *   Ensure `src/features/profile/queries/profile.queries.ts` has a Server Action `getCurrentUserProfile(): Promise<UserProfile>` that:
        *   Gets the authenticated user ID.
        *   Calls `getProfileByUserId`.
        *   Returns the `UserProfile` (matching the detailed schema) or throws an error.

### Task 1.4: Create `useUserProfileQuery` Hook
*   [ ] **Create `src/features/profile/hooks/use-user-profile-query.ts`**:
    *   This client-side hook will use TanStack Query's `useQuery`.
    *   `queryKey`: `['userProfile', userId]` (where `userId` comes from the session context).
    *   `queryFn`: `getCurrentUserProfile` (the Server Action).
    *   It should handle `enabled` state based on user authentication status.
    *   Returns `{ profile: UserProfile | undefined, isLoading: profileIsLoading, isError: profileIsError, error: profileError }`.
*   [ ] **Create `src/features/profile/hooks/index.ts`** (if not exists) and export `useUserProfileQuery`.

### Task 1.5: Create the New `useAuth` Hook
*   [ ] **Create `src/features/auth/hooks/use-auth.ts`**:
    *   This will be a client-side hook.
    *   It will consume the `AuthSessionContext` to get the raw `user`, `isLoading` (session loading), and `sessionError`.
    *   It will call `useUserProfileQuery` to get `profile` (the detailed UserProfile), `profileIsLoading`, `profileIsError`, `profileError`.
    *   It will combine these states:
        *   `isAuthenticated`: Derived from `!!user`.
        *   `isLoading`: True if session is loading OR profile is loading (if user is authenticated).
        *   `user`: The raw Supabase user object.
        *   `profile`: The fetched detailed user profile data.
        *   `error`: Combined error state from session or profile fetching.
    *   **Return Value**: `{ user, profile, isAuthenticated, isLoading, error }`.
*   [ ] **Update `src/features/auth/hooks/index.ts`** to export the new `useAuth`.

### Task 1.6: Refactor Zustand Store (`useAuthStore`)
*   [ ] **Modify `src/stores/auth.store.ts`**:
    *   This store will now be for **minimal, purely client-side global state not directly tied to auth session or server-fetched profile**.
    *   Remove `user`, `profile`, `isAuthenticated`, `isLoading` (related to auth), `error` (related to auth).
    *   Remove `setUserOnly`, `fetchUserProfile`, `clearAuth`, `setLoading`, `setError` actions.
    *   Remove `initializeAuthListener`.
    *   **Purpose**: This store can remain for future use (e.g., theme settings, global UI states not managed by server data). If no immediate use, consider removing it entirely or commenting it out. For this plan, we'll assume it's simplified for now.

### Task 1.7: Update Components Using Auth State
*   [ ] **Modify `src/features/homepage/components/header.tsx`**:
    *   Import and use the new `useAuth` hook from `@/features/auth/hooks`.
    *   Adapt its conditional rendering logic based on the state provided by the new `useAuth` hook (e.g., displaying `profile.firstName` or `profile.avatarUrl`).
*   [ ] **Review and update any other components** that might have been using the old Zustand-based `useAuth` hook.

## Phase 2: Implement TanStack Query for Data Fetching (General)

This phase ensures TanStack Query is properly set up for all server state management.

### Task 2.1: Setup QueryClientProvider
*   [ ] **Create `src/components/providers/query-provider.tsx`**:
    *   This client component initializes `QueryClient` and wraps children with `QueryClientProvider`.
    *   Include `ReactQueryDevtools` for development.
*   [ ] **Update `src/app/layout.tsx`**:
    *   Add `QueryProvider` to wrap the application, likely outside or as a sibling to `AuthSessionProvider`.

### Task 2.2: Review Existing Data Fetching
*   [ ] Identify any other places where data is fetched directly (e.g., in Server Components or client components using `useEffect` + `fetch`) that should be migrated to TanStack Query using Server Actions as query functions. (Currently, our main data fetching related to auth is the profile).

## Phase 3: Code Cleanup and Documentation Update

### Task 3.1: Remove Redundant Code
*   [ ] If `src/stores/auth.store.ts` is no longer needed (after its auth-related parts are removed), consider deleting it.
*   [ ] Delete the old `AuthStateProvider` (if it was a separate file and the new one from Task 1.1 replaces its role in the layout).

### Task 3.2: Update Project Documentation
*   [ ] **Modify `docs/project-overview.md`**:
    *   Update sections on authentication flow to reflect the new `useAuth` hook, `AuthSessionProvider`, and the roles of Context/React Query.
*   [ ] **Modify `docs/integrating-state-and-data-fetching.md`**:
    *   Rewrite this document to reflect the new primary approach (Context + React Query for auth state and profile).
    *   Clarify Zustand's role for non-server, non-auth-session global state.
*   [ ] **Modify `docs/adding-new-features.md`**:
    *   Ensure the "User Profile Page" example aligns with the new `useAuth` hook and data fetching patterns, reflecting the detailed `UserProfile` schema.
*   [ ] **Modify `docs/supabase-client-deep-dive.md`**:
    *   Ensure it accurately reflects how `AuthSessionProvider` uses the client-side Supabase instance.

## Phase 4: Testing

### Task 4.1: Thoroughly Test Authentication Flows
*   [ ] Test registration.
*   [ ] Test login.
*   [ ] Test logout.
*   [ ] Test password reset.
*   [ ] Test email confirmation.
*   [ ] Verify conditional UI rendering based on auth state in `HomepageHeader` and any other relevant components.
*   [ ] Verify profile data is displayed correctly using the new `useAuth` hook and detailed `UserProfile` structure (if applicable in current UI).

### Task 4.2: Test Data Fetching with TanStack Query
*   [ ] Verify profile data fetching, loading states, and error states for the detailed `UserProfile`.
*   [ ] Check React Query Devtools for query caching and behavior.

This plan provides a structured approach to refactoring your application. Each task can be broken down further as needed.
    

