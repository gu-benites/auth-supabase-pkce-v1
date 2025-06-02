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
  // We still use HydrationBoundary here to ensure any dehydrated state from the layout
  // is correctly passed down and available for client-side hydration.

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <main className="container mx-auto py-8 px-4">
        {/* Title will be handled by DashboardHeader based on route */}
        <ProfileView />
      </main>
    </HydrationBoundary>
  );
}
