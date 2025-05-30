
# Implementation Plan: Aligning with Consultant Feedback for Auth & State

This document outlines the step-by-step plan to refactor the PassForge application's authentication and state management to align with the consultant's recommendations. The goal is to leverage React Context for raw session data, TanStack Query for fetching user profile data, and refine Zustand's role for minimal, purely client-side global state if needed.

## Phase 1: Refactor Core Auth State Management (useAuth Hook)

This phase focuses on restructuring how authentication state (session, user object, profile) is managed and accessed in client components.

### [x] Task 1.1: Create AuthSessionProvider (React Context)
*   **File**: `src/providers/auth-session-provider.tsx`
*   **Details**: Client Component (`'use client'`). Uses Supabase browser client, `onAuthStateChange`. Provides raw Supabase `User`, `isLoading` (for initial session check), and `error` via Context.
*   **Status**: Implemented.

### [x] Task 1.2: Update Root Layout
*   **File**: `src/app/layout.tsx`
*   **Details**: Removed old Zustand-based `AuthStateProvider`. Wrapped application with new `AuthSessionProvider`.
*   **Status**: Implemented.

### [x] Task 1.3: Create Service and Query for User Profile
*   **[x] Define `UserProfile` Schema**:
    *   **File**: `src/features/user-profile/schemas/profile.schema.ts`
    *   **Details**: Defines `UserProfileSchema` and `UserProfile` type, accurately representing the data from your `profiles` table and relevant `auth.users` data.
        ```typescript
        // src/features/user-profile/schemas/profile.schema.ts
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
    *   **Status**: Implemented.
*   **[x] Create `getProfileByUserId` Service**:
    *   **File**: `src/features/user-profile/services/profile.service.ts`
    *   **Details**: Fetches data from the `profiles` table and merges with relevant data from `auth.users` (like email). Uses server Supabase client. Selects all relevant fields as per `UserProfileSchema`.
    *   **Status**: Implemented.
*   **[x] Create `getCurrentUserProfile` Server Action (Query Function for TanStack Query)**:
    *   **File**: `src/features/user-profile/queries/profile.queries.ts`
    *   **Details**: Server Action that gets the authenticated user ID, calls `getProfileByUserId`, returns `UserProfile` or throws error.
    *   **Status**: Implemented.

### [x] Task 1.4: Create `useUserProfileQuery` Hook
*   **File**: `src/features/user-profile/hooks/use-user-profile-query.ts`
*   **Details**: Client-side hook using TanStack Query's `useQuery`. `queryKey: ['userProfile', userId]`, `queryFn: getCurrentUserProfile`. Handles `enabled` state.
*   **Barrel File**: `src/features/user-profile/hooks/index.ts` exports the hook.
*   **Status**: Implemented.

### [x] Task 1.5: Create the New `useAuth` Hook
*   **File**: `src/features/auth/hooks/use-auth.ts`
*   **Details**: Client-side hook. Consumes `AuthSessionContext`. Calls `useUserProfileQuery`. Combines states: `user`, `profile`, `authUser`, `isAuthenticated` (stricter: session AND profile loaded), `isLoadingAuth` (composite), `isSessionLoading`, `sessionError`, `isProfileLoading`, `profileError`.
*   **Barrel File**: `src/features/auth/hooks/index.ts` exports the new `useAuth`.
*   **Status**: Implemented.

### [x] Task 1.6: Refactor Zustand Store (`useAuthStore`)
*   **File**: `src/stores/auth.store.ts`
*   **Details**: This store is now for **minimal, purely client-side global state not directly tied to auth session or server-fetched profile**. Removed `user`, `profile`, `isAuthenticated`, `isLoading` (auth-related), `error` (auth-related), and related actions/listener. It's now a placeholder for other global states (e.g., theme settings, UI toggles). The concept of "slices" is relevant if this store grows with *other* types of global state.
*   **Status**: Implemented.

### [x] Task 1.7: Update Components Using Auth State
*   **File**: `src/features/homepage/components/hero-header/hero-header.tsx` (and its `mobile-menu.tsx`)
*   **Details**: Uses the new `useAuth` hook from `@/features/auth/hooks`. Adapts conditional rendering based on the state provided by `useAuth`. Handles display name and avatar using `profile` and fallback to `user.user_metadata`.
*   **Status**: Implemented.

## Phase 2: Implement TanStack Query for Data Fetching (General)

### [x] Task 2.1: Setup QueryClientProvider
*   **File**: `src/providers/query-client-provider.tsx` (moved from `src/components/providers/`)
*   **Details**: Client component initializes `QueryClient` (using `React.useState`) and wraps children with `QueryClientProvider`. Includes `ReactQueryDevtools`.
*   **File**: `src/app/layout.tsx`
*   **Details**: Correctly adds `QueryClientProvider` to wrap the application.
*   **Status**: Implemented and verified.

### [x] Task 2.2: Review Existing Data Fetching
*   **Details**: Main user-related data fetching (profile) is migrated to TanStack Query via `useUserProfileQuery`. Other data fetching needs can follow this pattern.
*   **Status**: Implemented.

## Phase 3: Code Cleanup and Documentation Update

### [x] Task 3.1: Remove Redundant Code
*   **Details**: `src/components/providers/auth-state-provider.tsx` (old Zustand provider) was confirmed deleted. `src/stores/auth.store.ts` refactored. Old provider files in `src/components/providers/` were moved to `src/providers/`, and the old directory was confirmed deleted.
*   **Status**: Implemented.

### [ ] Task 3.2: Update Project Documentation
*   **Files**: `docs/project-overview.md`, `docs/integrating-state-and-data-fetching.md`, `docs/supabase-client-deep-dive.md`, `docs/adding-new-features.md`.
*   **Details**: Ensure all docs reflect the new `useAuth` hook, `AuthSessionProvider`, `useUserProfileQuery`, service layer, action layer, and the roles of Context/React Query and Zustand.
*   **Status**: In progress / Last updated with these changes.

## Phase 4: Testing

### [ ] Task 4.1: Thoroughly Test Authentication Flows
*   [ ] Test registration.
*   [ ] Test login.
*   [ ] Test logout.
*   [ ] Test password reset.
*   [ ] Test email confirmation.
*   [ ] Verify conditional UI rendering based on auth state in `HomepageHeader` and any other relevant components.
*   [ ] Verify profile data is displayed correctly using the new `useAuth` hook and detailed `UserProfile` structure.

### [ ] Task 4.2: Test Data Fetching with TanStack Query
*   [ ] Verify profile data fetching, loading states, and error states for the detailed `UserProfile`.
*   [ ] Check React Query Devtools for query caching and behavior.

This plan provides a structured approach to refactoring your application.
