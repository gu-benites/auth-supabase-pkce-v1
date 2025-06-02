
# Adding New Features: Example - User Profile Page

This document guides you through adding a new feature to the PassForge application, using a "User Profile" page as an example. It assumes that the core authentication state management (React Context via `AuthSessionProvider` for raw session, TanStack Query via `useUserProfileQuery` for profile data, composed by the `useAuth` hook) has been integrated as described in `docs/integrating-state-and-data-fetching.md`.

## I. Introduction

The goal is to create a page where authenticated users can view their profile information. This guide will cover:
1.  Planning the feature.
2.  Conceptual database setup (Supabase) and `UserProfile` schema.
3.  Backend development (Service functions, Server Actions for TanStack Query in `user-core-data`).
4.  Frontend development (Next.js Page, React Component in `dashboard/profile` using `useAuth`).
5.  Navigation.

This process can be adapted for adding other data-driven features to the application.

## II. Prerequisites

Before proceeding, ensure you understand:
*   The existing authentication flow and project structure (see `docs/project-overview.md`).
*   How `AuthSessionProvider`, `useUserProfileQuery`, and the `useAuth` hook work together (see `docs/integrating-state-and-data-fetching.md`).
*   The Next.js App Router, Server Components, and Client Components.
*   The project's error logging and monitoring strategy (see `docs/error logging.md`).

## III. Step 1: Planning the User Profile Feature

### A. User Stories
*   **As an authenticated user, I want to view my profile information so that I can see my details.** (Focus of this guide)
*   (Future) As an authenticated user, I want to edit my profile information so that I can keep my details up-to-date.

### B. Data Model & Schema (`UserProfile`)
The profile page will display data defined by the `UserProfileSchema` (`@/features/user-core-data/schemas/profile.schema.ts`). This schema includes fields like:
*   `id` (UUID)
*   `email` (from `auth.users`)
*   `firstName`
*   `lastName`
*   `gender`
*   `ageCategory`
*   `specificAge`
*   `language`
*   `avatarUrl`
*   `role`
*   Stripe and subscription-related fields
*   `createdAt`, `updatedAt`

This detailed schema is defined in `src/features/user-core-data/schemas/profile.schema.ts` and aligns with the `profiles` table structure outlined in `docs/supabase-setup-guide.md` (or similar internal db schema documentation).

## IV. Step 2: Supabase Database Setup (Conceptual Review)

Ensure your Supabase database has the `profiles` table as defined (or similar to the example in your database schema documentation), with appropriate columns and Row Level Security (RLS) policies.

*   **`profiles` Table:** Should have `id` (referencing `auth.users.id`) and columns matching the `UserProfileSchema`.
*   **RLS Policies:**
    *   Users can read their own profile.
    *   Users can (typically) insert their own profile once.
    *   Users can update their own profile.
*   **`handle_new_user` Trigger (Optional but Recommended):** A Supabase database function can automatically create a `profiles` row when a new user signs up in `auth.users`.

## V. Step 3: Backend - Service and Query Action (Already Implemented in `user-core-data`)

The core backend logic for fetching the user profile is already in place within `src/features/user-core-data/`.

### A. Zod Schema for Profile Data (`src/features/user-core-data/schemas/profile.schema.ts`)
*   This file defines `UserProfileSchema` and the `UserProfile` type. It should match your `profiles` table structure.

### B. Service Function to Fetch Profile Data (`src/features/user-core-data/services/profile.service.ts`)
*   The `getProfileByUserId(userId: string, userEmail: string | null | undefined)` function:
    *   Is a Server Action (`'use server';`).
    *   Uses the server-side Supabase client.
    *   Fetches data from the `profiles` table and uses the provided `userEmail`.
    *   Merges this data to match the `UserProfileSchema`.
    *   Returns `{ data: UserProfile | null; error: Error | null }`.

### C. Server Action (Query Function for TanStack Query - `src/features/user-core-data/queries/profile.queries.ts`)
*   The `getCurrentUserProfile(): Promise<UserProfile>` Server Action:
    *   Gets the authenticated user's ID and email using `supabase.auth.getUser()`.
    *   Calls `getProfileByUserId` with the user's ID and email.
    *   Validates the result against `UserProfileSchema`.
    *   Returns the `UserProfile` or throws an error. This is used by TanStack Query.

## VI. Step 4: Frontend - Page and Display Component

### A. Create the Profile Page Route
**Create `src/app/(dashboard)/dashboard/profile/page.tsx`:**
```tsx
// src/app/(dashboard)/dashboard/profile/page.tsx
import { ProfileView } from '@/features/dashboard/profile'; // Updated import
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';
// User profile is already prefetched by the (dashboard)/layout.tsx.

/**
 * Renders the user's profile page, accessible at /dashboard/profile.
 * The user profile data is expected to be prefetched by the parent (dashboard) layout
 * and made available via HydrationBoundary.
 *
 * @returns {Promise<JSX.Element>} The profile page component.
 */
export default async function ProfilePage(): Promise<JSX.Element> {
  const queryClient = new QueryClient();
  // The actual prefetching of userProfile happens in (dashboard)/layout.tsx.

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <main className="container mx-auto py-8 px-4">
        {/* Title will be handled by DashboardHeader based on route */}
        <ProfileView /> {/* Updated component name */}
      </main>
    </HydrationBoundary>
  );
}
```

### B. Create the Profile Display Component
This component uses the `useAuth` hook to get the detailed profile.

**Create/Update `src/features/dashboard/profile/profile-view.tsx`:** (Formerly `profile-display.tsx`)
```tsx
// src/features/dashboard/profile/profile-view.tsx
'use client';

import { useAuth } from '@/features/auth/hooks';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserCircle2, Mail, Info, ShieldCheck, Briefcase, CalendarDays, Languages, Edit3 } from 'lucide-react';
import * as Sentry from '@sentry/nextjs';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

/**
 * Renders the display for the user's profile information.
 * It uses the `useAuth` hook to get the user's session and profile data.
 * Handles loading states, errors, and displays the profile details in a Card component.
 */
export function ProfileView() { // Renamed from ProfileDisplay
  const {
    user,
    profile,
    isLoadingAuth,
    isSessionLoading,
    sessionError,
    profileError,
    isAuthenticated,
  } = useAuth();

  const getInitials = () => {
    if (!user && !profile) return <UserCircle2 size={24} />;
    const first = profile?.firstName || (user?.user_metadata?.first_name as string)?.[0] || '';
    const last = profile?.lastName || (user?.user_metadata?.last_name as string)?.[0] || '';
    return `${first}${last}`.toUpperCase() || <UserCircle2 size={24} />;
  };
  
  const avatarUrl = profile?.avatarUrl || (user?.user_metadata?.avatar_url as string | undefined);
  const displayName = profile?.firstName || profile?.lastName 
    ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim()
    : user?.email?.split('@')[0] || 'User Profile';

  if (isSessionLoading || (!profile && isLoadingAuth && user)) {
    return (
      <Card className="w-full max-w-2xl mx-auto animate-pulse">
        <CardHeader className="items-center text-center">
          <Skeleton className="h-28 w-28 rounded-full mb-4" />
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1"><Skeleton className="h-3 w-1/3" /><Skeleton className="h-6 w-2/3" /></div>
              <div className="space-y-1"><Skeleton className="h-3 w-1/3" /><Skeleton className="h-6 w-2/3" /></div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (sessionError) {
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto">
        <AlertTitle>Session Error</AlertTitle>
        <AlertDescription>
          {sessionError.message || 'An error occurred while verifying your session.'}
        </AlertDescription>
      </Alert>
    );
  }
  
  if (!user && !isSessionLoading) { 
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto">
        <AlertTitle>Not Authenticated</AlertTitle>
        <AlertDescription>
          Please log in to view your profile. You may be redirected.
        </AlertDescription>
      </Alert>
    );
  }
  
  if (profileError && user) { 
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto">
        <AlertTitle>Error Loading Profile Data</AlertTitle>
        <AlertDescription>
          {profileError.message || 'An unknown error occurred while fetching your profile details.'}
        </AlertDescription>
      </Alert>
    );
  }

  if (!profile && user && !isLoadingAuth) { 
     Sentry.captureMessage('ProfileView: User authenticated but profile data is missing and not loading.', { // Updated component name in log
        level: 'warning',
        extra: { userId: user.id, profile, isLoadingAuth, isProfileLoading: profileError?.message }
      });
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle>Profile Not Available</CardTitle>
          <CardDescription>Your profile details could not be loaded at this time.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Please try refreshing the page or contact support if the issue persists.</p>
        </CardContent>
      </Card>
    );
  }
  
  if (!profile || !user) { 
    Sentry.captureMessage('ProfileView: Profile or User is unexpectedly null/undefined after loading checks.', { // Updated component name in log
      level: 'error',
      extra: { userId: user?.id, profileExists: !!profile, userExists: !!user, isAuthenticated, isLoadingAuth },
    });
    return (
         <Alert variant="destructive" className="max-w-2xl mx-auto">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>An unexpected error occurred. Profile data cannot be displayed.</AlertDescription>
        </Alert>
    );
  }

  const ProfileDetailItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value?: string | number | null }) => {
    if (!value) return null;
    return (
      <div className="flex items-start space-x-3">
        <Icon className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className="text-foreground text-lg">{value}</p>
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl rounded-lg overflow-hidden">
      <CardHeader className="text-center bg-muted/30 p-8 rounded-t-lg relative">
         <div className="absolute top-4 right-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/profile/edit"> 
              <Edit3 className="h-4 w-4 mr-2" /> Edit Profile
            </Link>
          </Button>
        </div>
        <div className="flex justify-center mb-4">
          <Avatar className="h-32 w-32 text-5xl border-4 border-background shadow-lg">
            <AvatarImage src={avatarUrl || undefined} alt={displayName} />
            <AvatarFallback className="bg-primary text-primary-foreground">
                {getInitials()}
            </AvatarFallback>
          </Avatar>
        </div>
        <CardTitle className="text-4xl font-bold">{displayName}</CardTitle>
        <CardDescription className="text-md text-muted-foreground">
            Role: {profile.role || 'User'}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 md:p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          <ProfileDetailItem icon={Mail} label="Email" value={profile.email} />
          <ProfileDetailItem icon={ShieldCheck} label="User ID" value={profile.id} />
        </div>
        
        {(profile.firstName || profile.lastName) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <ProfileDetailItem icon={UserCircle2} label="First Name" value={profile.firstName} />
            <ProfileDetailItem icon={UserCircle2} label="Last Name" value={profile.lastName} />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <ProfileDetailItem icon={Languages} label="Preferred Language" value={profile.language} />
            <ProfileDetailItem icon={Info} label="Age Category" value={profile.ageCategory} />
        </div>
        
        {profile.specificAge && (
            <ProfileDetailItem icon={Info} label="Specific Age" value={profile.specificAge} />
        )}

        {profile.subscriptionStatus && (
             <div className="space-y-3 pt-4 border-t border-border">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center"><Briefcase className="h-5 w-5 mr-2 text-primary"/>Subscription Details</h3>
                <div className="p-4 bg-muted/50 rounded-md space-y-2">
                    <p className="text-sm"><span className="font-medium text-foreground">Status:</span> {profile.subscriptionStatus}</p>
                    {profile.subscriptionTier && <p className="text-sm"><span className="font-medium text-foreground">Tier:</span> {profile.subscriptionTier}</p>}
                    {profile.subscriptionPeriod && <p className="text-sm"><span className="font-medium text-foreground">Period:</span> {profile.subscriptionPeriod}</p>}
                    {profile.subscriptionEndDate && <p className="text-sm"><span className="font-medium text-foreground">Renews/Expires:</span> {new Date(profile.subscriptionEndDate).toLocaleDateString()}</p>}
                </div>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 pt-4 border-t border-border">
          <ProfileDetailItem icon={CalendarDays} label="Profile Created" value={new Date(profile.createdAt).toLocaleDateString()} />
          <ProfileDetailItem icon={CalendarDays} label="Last Updated" value={new Date(profile.updatedAt).toLocaleDateString()} />
        </div>
      </CardContent>
    </Card>
  );
}
```
**Create `src/features/dashboard/profile/index.ts` (Barrel File):**
```typescript
// src/features/dashboard/profile/index.ts
export * from './profile-view';
```

## VII. Step 6: Navigation

Add links to the new profile page:

1.  **In `src/features/dashboard/components/dashboard-user-menu.tsx`:** (Path updated)
    *   Ensure "Profile" in `userMenuItems` array has `href: "/dashboard/profile"`.

2.  **In `src/features/dashboard/components/dashboard-sidebar.tsx`:** (Path updated)
    *   Ensure "Profile" in `navItems` array has `href: "/dashboard/profile"`.

## VIII. Conclusion and Next Steps

You've now added a "User Profile" page that integrates with the established authentication architecture:
*   Leveraging the `useAuth` hook for comprehensive auth state.
*   Benefiting from server-side prefetching of profile data handled by the `(dashboard)/layout.tsx`.
*   Displaying the information in a dedicated component within `src/features/dashboard/profile/`.
*   Core user data logic is encapsulated in `src/features/user-core-data/`.

**Next Steps (Beyond this Guide):**
*   **Implement Edit Profile:** Create new Server Actions (mutations) in `src/features/user-core-data/actions/` for updating profile data, new Zod schemas for edit validation, and an editable form component (likely within `src/features/dashboard/profile/components/`). Use `useMutation` from TanStack Query to handle updates and revalidate the profile query.
*   **File Uploads for Avatar:** Implement avatar uploads and update the profile.
*   **Testing:** Write tests for your components, actions, and services.

## IX. Error Handling and Logging Considerations for New Features
(This section remains largely the same, just be mindful of the new `user-core-data` paths if logging specific service/action names.)

## X. Handling Complex Form Data with Server Actions
(This section remains the same conceptually.)
```