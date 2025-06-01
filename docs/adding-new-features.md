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
*   The project's error logging and monitoring strategy (see `docs/error logging.md`).

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

This detailed schema is defined in `src/features/user-profile/schemas/profile.schema.ts` and aligns with the `profiles` table structure outlined in `docs/supabase-setup-guide.md` (or similar internal db schema documentation).

## IV. Step 2: Supabase Database Setup (Conceptual Review)

Ensure your Supabase database has the `profiles` table as defined (or similar to the example in your database schema documentation), with appropriate columns and Row Level Security (RLS) policies.

*   **`profiles` Table:** Should have `id` (referencing `auth.users.id`) and columns matching the `UserProfileSchema`.
*   **RLS Policies:**
    *   Users can read their own profile.
    *   Users can (typically) insert their own profile once.
    *   Users can update their own profile.
*   **`handle_new_user` Trigger (Optional but Recommended):** A Supabase database function can automatically create a `profiles` row when a new user signs up in `auth.users`.

## V. Step 3: Backend - Service and Query Action (Already Implemented)

The core backend logic for fetching the user profile is already in place as per `docs/integrating-state-and-data-fetching.md` and `docs/project-overview.md`:

### A. Zod Schema for Profile Data (`src/features/user-profile/schemas/profile.schema.ts`)
*   This file defines `UserProfileSchema` and the `UserProfile` type. It should match your `profiles` table structure.

### B. Service Function to Fetch Profile Data (`src/features/user-profile/services/profile.service.ts`)
*   The `getProfileByUserId(userId: string, userEmail: string | null | undefined)` function:
    *   Is a Server Action (`'use server';`).
    *   Uses the server-side Supabase client.
    *   Fetches data from the `profiles` table and uses the provided `userEmail`.
    *   Merges this data to match the `UserProfileSchema`.
    *   Returns `{ data: UserProfile | null; error: Error | null }`.

### C. Server Action (Query Function for TanStack Query - `src/features/user-profile/queries/profile.queries.ts`)
*   The `getCurrentUserProfile(): Promise<UserProfile>` Server Action:
    *   Gets the authenticated user's ID and email using `supabase.auth.getUser()`.
    *   Calls `getProfileByUserId` with the user's ID and email.
    *   Validates the result against `UserProfileSchema`.
    *   Returns the `UserProfile` or throws an error. This is used by TanStack Query.

## VI. Step 4: Frontend - Page and Display Component

### A. Create the Profile Page Route
**Create `src/app/(dashboard)/dashboard/profile/page.tsx`:** (Note the path change for nesting)
```tsx
// src/app/(dashboard)/dashboard/profile/page.tsx
import { ProfileDisplay } from '@/features/user-profile/components';
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';
// User profile is already prefetched by the (dashboard)/layout.tsx.
// No need to call createClient() or prefetchQuery for profile here again.

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
  // We still use HydrationBoundary here to ensure any dehydrated state from the layout
  // is correctly passed down and available for client-side hydration.
  // If this page had its *own* specific data to prefetch, it would be done here.

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <main className="container mx-auto py-8 px-4">
        {/* Title will be handled by DashboardHeader based on route */}
        <ProfileDisplay />
      </main>
    </HydrationBoundary>
  );
}
```

### B. Create the Profile Display Component
This component uses the `useAuth` hook to get the detailed profile.

**Create/Update `src/features/user-profile/components/profile-display.tsx`:**
```tsx
// src/features/user-profile/components/profile-display.tsx
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
export function ProfileDisplay() {
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
  
  if (!user && !isSessionLoading) { // User not logged in, session check complete
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto">
        <AlertTitle>Not Authenticated</AlertTitle>
        <AlertDescription>
          Please log in to view your profile. You may be redirected.
        </AlertDescription>
      </Alert>
    );
  }
  
  if (profileError && user) { // Check profileError if user session is valid
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto">
        <AlertTitle>Error Loading Profile Data</AlertTitle>
        <AlertDescription>
          {profileError.message || 'An unknown error occurred while fetching your profile details.'}
        </AlertDescription>
      </Alert>
    );
  }

  if (!profile && user && !isLoadingAuth) { // Session is valid, profile not loaded, not currently loading
     Sentry.captureMessage('ProfileDisplay: User authenticated but profile data is missing and not loading.', {
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
  
  if (!profile || !user) { // Fallback if none of the above caught it
    Sentry.captureMessage('ProfileDisplay: Profile or User is unexpectedly null/undefined after loading checks.', {
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

  // Helper to render profile items
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
            <Link href="/dashboard/profile/edit"> {/* Placeholder for edit page */}
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
**Create `src/features/user-profile/components/index.ts` (Barrel File):**
```typescript
// src/features/user-profile/components/index.ts
export * from './profile-display';
```

## VII. Step 6: Navigation

Add links to the new profile page:

1.  **In `src/features/dashboard/layout/user-menu.tsx`:**
    *   Add "Profile" to `userMenuItems` array, ensuring `href` is `/dashboard/profile`.

    ```tsx
    // src/features/dashboard/layout/user-menu.tsx
    // ... other imports
    import { User as UserIcon } from 'lucide-react'; // For profile icon

    const userMenuItems: UserMenuItemType[] = [
      {
        title: "Profile",
        href: "/dashboard/profile", // Ensure this matches your route
        icon: <UserIcon className="h-5 w-5" />,
      },
      {
        title: "Settings",
        href: "/settings", // Adjust path if needed, e.g., /dashboard/settings
        icon: <Settings className="h-5 w-5" />,
      },
      // ... other items
    ];
    // ... rest of the component
    ```

2.  **In `src/features/dashboard/layout/dashboard-sidebar.tsx`:**
    *   Add "Profile" to `navItems` array, ensuring `href` is `/dashboard/profile`.

    ```tsx
    // src/features/dashboard/layout/dashboard-sidebar.tsx
    // ... other imports
    import { User as UserIcon } from 'lucide-react'; // For profile icon

    const navItems: NavItem[] = [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: <Home className="h-5 w-5" />,
      },
      {
        title: "Profile", // Added Profile link
        href: "/dashboard/profile",
        icon: <UserIcon className="h-5 w-5" />, // UserIcon aliased if needed
      },
      // ... other items
    ];
    // ... rest of the component
    ```

## VIII. Conclusion and Next Steps

You've now added a "User Profile" page that integrates with the established authentication architecture:
*   Leveraging the `useAuth` hook for comprehensive auth state.
*   Benefiting from server-side prefetching of profile data handled by the `(dashboard)/layout.tsx`.
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

*   Consult the main error logging documentation at `docs/error logging.md` for the complete strategy and more detailed explanations.
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
