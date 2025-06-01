// src/app/(dashboard)/profile/page.tsx
import { ProfileDisplay } from '@/features/user-profile/components';
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';
// User profile is already prefetched by the (dashboard)/layout.tsx
// No need to call createClient() or prefetchQuery for profile here again.

/**
 * Renders the user's profile page.
 * The user profile data is expected to be prefetched by the parent (dashboard) layout
 * and made available via HydrationBoundary.
 *
 * @returns {Promise<JSX.Element>} The profile page component.
 */
export default async function ProfilePage(): Promise<JSX.Element> {
  const queryClient = new QueryClient();
  // The actual prefetching of userProfile happens in (dashboard)/layout.tsx
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
