
# Adding New Features: Example - User Profile Page

This document guides you through adding a new feature to the PassForge application, using a "User Profile" page as an example. It assumes that the core authentication state management (React Context via `AuthSessionProvider` for raw session, TanStack Query via `useUserProfileQuery` for profile data, composed by the `useAuth` hook) has been integrated as described in `docs/integrating-state-and-data-fetching.md`.

## I. Introduction

The goal is to create a page where authenticated users can view their profile information. This guide will cover:
1.  Planning the feature.
2.  Conceptual database setup (Supabase) and `UserProfile` schema.
3.  Backend development (Service functions, Server Actions for TanStack Query).
4.  Frontend development (Next.js Page, React Component using `useAuth` and `useUserProfileQuery`).
5.  Navigation.

This process can be adapted for adding other data-driven features to the application.

## II. Prerequisites

Before proceeding, ensure you understand:
*   The existing authentication flow and project structure (see `docs/project-overview.md`).
*   How `AuthSessionProvider`, `useUserProfileQuery`, and the `useAuth` hook work together (see `docs/integrating-state-and-data-fetching.md`).
*   The Next.js App Router, Server Components, and Client Components.
*   The project's error logging and monitoring strategy (see `docs/do_not_change_or_delete/future_plans/error logging.md`).

## III. Step 1: Planning the User Profile Feature

### A. User Stories
*   **As an authenticated user, I want to view my profile information so that I can see my details.** (Focus of this guide)
*   (Future) As an authenticated user, I want to edit my profile information so that I can keep my details up-to-date.

### B. Data Model & Schema (`UserProfile`)
The profile page will display data defined by the `UserProfileSchema` (`@/features/user-profile/schemas/profile.schema.ts`). This schema includes fields like:
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

This detailed schema is defined in `src/features/user-profile/schemas/profile.schema.ts` and aligns with the `profiles` table structure outlined in `docs/implementation-consultant.md`.

## IV. Step 2: Supabase Database Setup (Conceptual Review)

Ensure your Supabase database has the `profiles` table as defined (or similar to the example in `docs/implementation-consultant.md`), with appropriate columns and Row Level Security (RLS) policies.

*   **`profiles` Table:** Should have `id` (referencing `auth.users.id`) and columns matching the `UserProfileSchema`.
*   **RLS Policies:**
    *   Users can read their own profile.
    *   Users can (typically) insert their own profile once.
    *   Users can update their own profile.
*   **`handle_new_user` Trigger (Optional but Recommended):** A Supabase database function can automatically create a `profiles` row when a new user signs up in `auth.users`.

## V. Step 3: Backend - Service and Query Action (Already Implemented)

The core backend logic for fetching the user profile is already in place as per `docs/implementation-consultant.md`:

### A. Zod Schema for Profile Data (`src/features/user-profile/schemas/profile.schema.ts`)
*   This file defines `UserProfileSchema` and the `UserProfile` type. It should match your `profiles` table structure.

### B. Service Function to Fetch Profile Data (`src/features/user-profile/services/profile.service.ts`)
*   The `getProfileByUserId(userId: string)` function:
    *   Is a Server Action (`'use server';`).
    *   Uses the server-side Supabase client.
    *   Fetches data from the `profiles` table and `auth.users` (for email).
    *   Merges this data to match the `UserProfileSchema`.
    *   Returns `{ data: UserProfile | null; error: Error | null }`.

### C. Server Action (Query Function for TanStack Query - `src/features/user-profile/queries/profile.queries.ts`)
*   The `getCurrentUserProfile(): Promise<UserProfile>` Server Action:
    *   Gets the authenticated user's ID.
    *   Calls `getProfileByUserId`.
    *   Validates the result against `UserProfileSchema`.
    *   Returns the `UserProfile` or throws an error. This is used by TanStack Query.

## VI. Step 4: Frontend - Page and Display Component

### A. Create the Profile Page Route
**Create `src/app/profile/page.tsx` (if not already present or adapt if it exists):**
```tsx
// src/app/profile/page.tsx
import { ProfileDisplay } from '@/features/user-profile/components';
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';
import { getCurrentUserProfile } from '@/features/user-profile/queries';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server'; // For server-side auth check

// This page should be protected. Middleware should handle redirection if not authenticated.
// We add an additional check here for robustness.
export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // This should ideally be caught by middleware, but good to have a fallback.
    redirect('/login?message=Please log in to view your profile.');
  }

  const queryClient = new QueryClient();

  // Optional: Prefetch data on the server for faster initial load
  try {
    await queryClient.prefetchQuery({
      queryKey: ['userProfile', user.id],
      queryFn: getCurrentUserProfile,
    });
  } catch (error) {
    console.error("Failed to prefetch user profile:", error);
    // Handle prefetch error, e.g. by not dehydrating or showing a generic error on client
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <main className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6 text-foreground">Your Profile</h1>
        <ProfileDisplay />
      </main>
    </HydrationBoundary>
  );
}
```

### B. Create the Profile Display Component
This component uses the `useAuth` hook to get both the raw user and the detailed profile.

**Create/Update `src/features/user-profile/components/profile-display.tsx`:**
```tsx
// src/features/user-profile/components/profile-display.tsx
'use client';

import { useAuth } from '@/features/auth/hooks'; // The composite auth hook
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserCircle2 } from 'lucide-react';
import * as Sentry from '@sentry/nextjs'; // Import Sentry

export function ProfileDisplay() {
  // useAuth provides the composite state:
  // user: raw Supabase user from AuthSessionProvider
  // profile: detailed UserProfile from useUserProfileQuery (TanStack Query)
  // authUser: combined user and profile when fully authenticated
  // isAuthenticated: boolean (stricter: session AND profile loaded)
  // isLoadingAuth: composite loading (session OR profile if authenticated)
  // isSessionLoading: boolean for session provider's initial load
  // sessionError: error from session provider
  const {
    user,
    profile,
    // authUser, // Use this if you need combined object directly
    isAuthenticated, // Use this to ensure profile is also loaded
    isLoadingAuth, // Composite loading: session OR (session + profile)
    isSessionLoading, // Use this for the initial "Am I logged in?" check
    sessionError, // For session specific errors
    profileError, // For profile specific errors
  } = useAuth();

  // Note: The useAuth hook already logs sessionError and profileError to Sentry.
  // Additional Sentry logging can be added here for states specific to this component if needed.

  if (isSessionLoading) { // Show loading while session is being determined
    return (
      <Card className="w-full max-w-lg mx-auto animate-pulse">
        <CardHeader>
          <Skeleton className="h-8 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="space-y-2 flex-grow">
              <Skeleton className="h-6 w-4/5" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
          {/* Add more skeleton elements as needed */}
        </CardContent>
      </Card>
    );
  }

  if (sessionError) {
    // Error is already logged by useAuth. Display UI feedback.
    return (
      <Alert variant="destructive">
        <AlertTitle>Session Error</AlertTitle>
        <AlertDescription>
          {sessionError.message || 'An error occurred while verifying your session.'}
        </AlertDescription>
      </Alert>
    );
  }
  
  if (!user && !isSessionLoading) { // User not logged in, session check complete
    return (
      <Alert variant="destructive">
        <AlertTitle>Not Authenticated</AlertTitle>
        <AlertDescription>
          Please log in to view your profile. You may be redirected.
        </AlertDescription>
      </Alert>
    );
  }

  // At this point, session is resolved and user object exists.
  // Now check profile-specific loading or errors, or if profile is ready (via isAuthenticated).
  if (isLoadingAuth && user) { // Still loading profile data, or initial auth loading (which includes profile)
     return (
      <Card className="w-full max-w-lg mx-auto animate-pulse">
        <CardHeader>
          <Skeleton className="h-8 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-6">
            <p className="text-muted-foreground">Loading profile details...</p>
          {/* Skeletons for profile specific fields */}
            <div className="flex items-center space-x-4">
              <Skeleton className="h-24 w-24 rounded-full" />
              <div className="space-y-2 flex-grow">
                <Skeleton className="h-6 w-4/5" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
        </CardContent>
      </Card>
    );
  }
  
  if (profileError && user) { // Check profileError if user session is valid
    // Error is already logged by useAuth. Display UI feedback.
    return (
      <Alert variant="destructive">
        <AlertTitle>Error Loading Profile Data</AlertTitle>
        <AlertDescription>
          {profileError.message || 'An unknown error occurred while fetching your profile details.'}
        </AlertDescription>
      </Alert>
    );
  }

  if (!isAuthenticated && user) { // Session is valid, but profile isn't loaded (covered by isLoadingAuth or profileError usually)
      // This state might indicate an issue if not covered by profileError. Log it.
      Sentry.captureMessage('ProfileDisplay: User authenticated but profile data is missing without a profileError.', {
        level: 'warning',
        extra: { userId: user.id, profile, isLoadingAuth, isProfileLoading: profileError } // Corrected isProfileLoading to profileError context
      });
      return (
          <Card className="w-full max-w-lg mx-auto">
              <CardHeader>
                  <CardTitle>Profile Not Yet Available</CardTitle>
                  <CardDescription>Your profile details are being prepared or couldn't be loaded.</CardDescription>
              </CardHeader>
              <CardContent>
                  <p>Please try again shortly. If the issue persists, contact support.</p>
              </CardContent>
          </Card>
      );
  }

  if (!profile) { // Fallback if none of the above caught it (should be rare with new useAuth logic)
    Sentry.captureMessage('ProfileDisplay: Profile is unexpectedly null/undefined after loading checks.', {
      level: 'error',
      extra: { userId: user?.id, isAuthenticated, isLoadingAuth },
    });
    return <p>Profile data not found. An unexpected issue occurred.</p>;
  }


  // Helper to get initials for Avatar Fallback
  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    const first = firstName?.[0] || '';
    const last = lastName?.[0] || '';
    return `${first}${last}`.toUpperCase() || <UserCircle2 size={24} />;
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl rounded-lg">
      <CardHeader className="text-center bg-muted/30 p-6 rounded-t-lg">
        <div className="flex justify-center mb-4">
          <Avatar className="h-28 w-28 text-4xl border-4 border-background shadow-md">
            <AvatarImage src={profile.avatarUrl || undefined} alt={`${profile.firstName} ${profile.lastName}`} />
            <AvatarFallback className="bg-primary text-primary-foreground">
                {getInitials(profile.firstName, profile.lastName)}
            </AvatarFallback>
          </Avatar>
        </div>
        <CardTitle className="text-3xl font-bold">
          {profile.firstName || profile.lastName ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim() : (user?.email || 'User Profile')}
        </CardTitle>
        <CardDescription className="text-md text-muted-foreground">
            Role: {profile.role || 'user'}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</p>
              <p className="text-foreground text-lg">{profile.email || 'Not available'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">User ID</p>
              <p className="text-foreground text-lg truncate">{profile.id}</p>
            </div>
        </div>
        
        {(profile.firstName || profile.lastName) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profile.firstName && (
                <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">First Name</p>
                    <p className="text-foreground text-lg">{profile.firstName}</p>
                </div>
                )}
                {profile.lastName && (
                <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Last Name</p>
                    <p className="text-foreground text-lg">{profile.lastName}</p>
                </div>
                )}
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profile.language && (
            <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Preferred Language</p>
                <p className="text-foreground text-lg">{profile.language}</p>
            </div>
            )}
            {profile.ageCategory && (
            <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Age Category</p>
                <p className="text-foreground text-lg">{profile.ageCategory}</p>
            </div>
            )}
        </div>

        {profile.subscriptionStatus && (
             <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Subscription Details</p>
                <div className="p-4 bg-muted/50 rounded-md space-y-1">
                    <p className="text-sm"><span className="font-medium text-foreground">Status:</span> {profile.subscriptionStatus}</p>
                    {profile.subscriptionTier && <p className="text-sm"><span className="font-medium text-foreground">Tier:</span> {profile.subscriptionTier}</p>}
                    {profile.subscriptionPeriod && <p className="text-sm"><span className="font-medium text-foreground">Period:</span> {profile.subscriptionPeriod}</p>}
                    {profile.subscriptionEndDate && <p className="text-sm"><span className="font-medium text-foreground">Renews/Expires:</span> {new Date(profile.subscriptionEndDate).toLocaleDateString()}</p>}
                </div>
            </div>
        )}
         {/* Add more profile fields here as needed */}
      </CardContent>
    </Card>
  );
}
```
**Create `src/features/user-profile/components/index.ts` (Barrel File if not exists):**
```typescript
// src/features/user-profile/components/index.ts
export * from './profile-display';
```

## VII. Step 6: Navigation

Add a link to the new profile page in a relevant navigation component (e.g., `src/features/homepage/components/hero-header/hero-header.tsx`):

```tsx
// Example modification in src/features/homepage/components/hero-header/hero-header.tsx
// ... other imports
import { useAuth } from '@/features/auth/hooks';

export function HeroHeader() {
  const { user, isSessionLoading } = useAuth(); // Get auth state

  // Determine if basic session exists (user object is present and session check is complete)
  const currentIsAuthenticated = !isSessionLoading && !!user;


  return (
    <header /* ... */ >
      <nav /* ... */ >
        {/* ... other nav items ... */}
        {!isSessionLoading && currentIsAuthenticated && ( // Show if session is loaded and user exists
            <Button variant="secondary" asChild size="sm">
                <Link href="/profile">Profile</Link>
            </Button>
        )}
        {/* ... other nav items ... */}
      </nav>
    </header>
  );
}
```

## VIII. Conclusion and Next Steps

You've now outlined how to add a "User Profile" page that integrates with the established authentication architecture:
*   Leveraging the `useAuth` hook for comprehensive auth state.
*   Fetching detailed profile data via `useUserProfileQuery` (TanStack Query).
*   Displaying the information in a dedicated component.

**Next Steps (Beyond this Guide):**
*   **Implement Edit Profile:** Create new Server Actions (mutations) for updating profile data, new Zod schemas for edit validation, and an editable form component. Use `useMutation` from TanStack Query to handle updates and revalidate the profile query.
*   **File Uploads for Avatar:** Implement avatar uploads (e.g., to Supabase Storage) and update the profile.
*   **Testing:** Write tests for your components, actions, and services.

## IX. Error Handling and Logging Considerations for New Features

When developing new features, adhere to the project's established error handling and logging strategy. This ensures consistency and aids in debugging and monitoring.

**A. Server-Side (Services, Server Actions, API Routes):**

1.  **Structured Logging with Winston:**
    *   Obtain a logger instance using `getServerLogger('MyNewFeatureService')` or `getServerLogger('MyNewFeatureAction')` from `src/lib/logger`.
    *   Log important operational steps, especially entry/exit points of functions, and critical parameters. **Always mask or exclude Personally Identifiable Information (PII)** from general logs.
        ```typescript
        // In src/features/my-new-feature/services/my-feature.service.ts
        // const logger = getServerLogger('MyNewFeatureService');
        // logger.info('Processing new item creation.', { category: itemData.category }); // Log non-sensitive parts
        ```
    *   When errors occur, log them with as much context as possible before throwing the error or returning an error state. Include the error object itself.
        ```typescript
        // logger.error('Failed to create item in database.', { error, itemId: itemData.id });
        ```
2.  **Sentry Integration:**
    *   Remember that Winston logs at `warn` and `error` levels are automatically sent to Sentry. Ensure your error logs are descriptive.
    *   For unhandled exceptions in Server Actions or API routes, Sentry will also capture them automatically.

**B. Client-Side (Components, Hooks):**

1.  **Sentry for Error Reporting:**
    *   **Unhandled Exceptions:** Sentry's client-side SDK (`@sentry/nextjs`), initialized in `src/instrumentation-client.ts`, automatically captures unhandled JavaScript errors.
    *   **Manual Error Capture:** For caught errors that are significant or indicate a problem, manually send them to Sentry:
        ```typescript
        // import * as Sentry from '@sentry/nextjs';
        try {
          // Some operation that might fail
        } catch (error) {
          Sentry.captureException(error, { extra: { component: 'MyNewFeatureComponent', context: 'specific_operation_failed' } });
          // Display user-friendly error message
        }
        ```
    *   **Manual Message Capture:** For important events or warnings that aren't full exceptions but indicate a potential issue:
        ```typescript
        // Sentry.captureMessage('User encountered an unexpected UI state in MyNewFeature.', 'warning', {
        //   extra: { userId: user?.id, featureState }
        // });
        ```
    *   Refer to how `useAuth`, `AuthSessionProvider`, and the authentication form components use Sentry for examples of manual capture.
2.  **User Feedback:**
    *   Always provide clear, user-friendly feedback for errors (e.g., using toasts or inline messages). Avoid exposing raw error details to the user.

**C. General Guidance:**

*   Consult the main error logging documentation at `docs/do_not_change_or_delete/future_plans/error logging.md` for the complete strategy and more detailed explanations.
*   Be mindful of PII: do not log sensitive user data unless absolutely necessary and properly secured/anonymized, especially in logs that might go to third-party services like Sentry.

This guide provides a template for extending the application with new features in a structured and maintainable way, including robust error handling and logging.

## X. Handling Complex Form Data with Server Actions

While the authentication forms in this project handle simple, flat data fields, many features will require submitting more complex data structures, such as arrays of objects (e.g., a list of order items, user preferences, etc.). `FormData` primarily supports simple key-value pairs. To handle complex data effectively with `FormData` and Server Actions, the recommended pattern is:

### A. The Challenge with FormData and Complex Data
`FormData` doesn't inherently support structured data like nested objects or arrays directly as distinct, typed fields. Trying to append an object directly will result in `[object Object]`.

### B. Recommended Pattern for Complex Data
This pattern involves serializing complex data into a JSON string on the client, sending it as a single `FormData` field, and then deserializing and validating it on the server.

1.  **Client-Side Steps:**
    *   **Collect Data:** Gather your complex data (e.g., an array of items from a dynamic form or state).
    *   **Serialize to JSON:** Use `JSON.stringify()` to convert the complex JavaScript object/array into a JSON string.
    *   **Append to FormData:** Append this JSON string to your `FormData` object under a specific key. A common convention is to use a key like `itemsJson` or `complexDataJson`.
        ```javascript
        // Example client-side logic (e.g., in a form submission handler)
        const items = [
          { productId: '123', quantity: 2 },
          { productId: '456', quantity: 1 },
        ];
        const formData = new FormData(event.currentTarget); // Or new FormData();
        formData.append('itemsJson', JSON.stringify(items));
        formData.append('orderNotes', 'Please ship quickly.'); // Other simple fields

        // Then submit formData to your Server Action
        // await yourServerAction(previousState, formData);
        ```

2.  **Server-Side Steps (within your Server Action):**
    *   **Retrieve JSON String:** Get the JSON string from `FormData` using its key.
        ```typescript
        // Example Server Action
        // import { z } from 'zod';

        // Define your Zod schema for the complex data
        // const OrderItemSchema = z.object({
        //   productId: z.string(),
        //   quantity: z.number().min(1),
        // });
        // const CreateOrderPayloadSchema = z.object({
        //   items: z.array(OrderItemSchema),
        //   orderNotes: z.string().optional(),
        // });

        export async function createOrderAction(prevState: any, formData: FormData) {
          const itemsJson = formData.get('itemsJson') as string | null;
          const orderNotes = formData.get('orderNotes') as string | null;
          let parsedItems = [];

          if (itemsJson) {
            try {
              parsedItems = JSON.parse(itemsJson);
            } catch (e) {
              // Handle JSON parsing error
              return { success: false, message: 'Invalid items data format.' };
            }
          }

          // Prepare the object for Zod validation
          const payloadToValidate = {
            items: parsedItems,
            orderNotes: orderNotes || undefined, // Handle optional simple fields
          };

          // Validate the parsed object
          // const validationResult = CreateOrderPayloadSchema.safeParse(payloadToValidate);
          // if (!validationResult.success) {
          //   // Handle validation errors
          //   return { success: false, message: 'Validation failed.', errors: validationResult.error.flatten() };
          // }

          // const validatedData = validationResult.data;
          // ... proceed with your business logic using validatedData.items and validatedData.orderNotes
          return { success: true, message: 'Order created!' };
        }
        ```
    *   **Parse JSON:** Use `JSON.parse()` to convert the JSON string back into a JavaScript object or array.
    *   **Validate with Zod:** Validate the *parsed JavaScript object* against your corresponding Zod schema (e.g., `CreateOrderPayloadSchema.parse(parsedObject)` or `safeParse`). Your Zod schema should be defined to match the structure of the *intended JavaScript object*, not the raw `FormData`.

### C. Why Validate the Parsed Object?
You validate the JavaScript object obtained after `JSON.parse()` because Zod schemas are designed to validate the structure and types of JavaScript data. This ensures that the data passed to your services or business logic is in the correct, expected format after being reconstructed from the `FormData` submission.

This approach allows you to leverage the simplicity of `FormData` for submissions while still being able to handle and robustly validate complex data structures on the server.
