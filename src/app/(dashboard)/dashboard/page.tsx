
// src/app/(dashboard)/dashboard/page.tsx

import { DashboardHomepageView } from '@/features/dashboard/dashboard-homepage'; // Updated import
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';
import { getCurrentUserProfile } from '@/features/user-profile/queries/profile.queries';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server'; 

/**
 * Server Component for the main dashboard page (/dashboard).
 * It handles prefetching essential user data (like the profile) to ensure
 * a smoother initial rendering experience for client components.
 * 
 * - Checks for an authenticated user. Redirects to /login if none.
 * - Initializes a TanStack Query client.
 * - Prefetches the user's profile data.
 * - Renders the DashboardHomepageView component wrapped in a HydrationBoundary
 *   to pass the prefetched data to the client-side query cache.
 *
 * @returns {Promise<JSX.Element>} The dashboard page component.
 */
export default async function DashboardPage(): Promise<JSX.Element> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?message=Please log in to view your dashboard.');
  }

  const queryClient = new QueryClient();

  try {
    await queryClient.prefetchQuery({
      queryKey: ['userProfile', user.id], 
      queryFn: getCurrentUserProfile,
    });
  } catch (error) {
    console.error("Failed to prefetch user profile for dashboard:", error);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardHomepageView /> {/* Updated component name */}
    </HydrationBoundary>
  );
}

    