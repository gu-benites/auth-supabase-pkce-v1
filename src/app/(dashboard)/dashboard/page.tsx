
import { DashboardHomePage } from '@/features/dashboard/components/dashboard-homepage';
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';
import { getCurrentUserProfile } from '@/features/user-profile/queries';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server'; // For server-side auth check

/**
 * Server Component for the main dashboard page (/dashboard).
 * It handles prefetching essential user data (like the profile) to ensure
 * a smoother initial rendering experience for client components.
 * 
 * - Checks for an authenticated user. Redirects to /login if none.
 * - Initializes a TanStack Query client.
 * - Prefetches the user's profile data.
 * - Renders the DashboardHomePage component wrapped in a HydrationBoundary
 *   to pass the prefetched data to the client-side query cache.
 *
 * @returns {Promise<JSX.Element>} The dashboard page component.
 */
export default async function DashboardPage(): Promise<JSX.Element> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // This should ideally be caught by middleware, but good to have a fallback.
    redirect('/login?message=Please log in to view your dashboard.');
  }

  const queryClient = new QueryClient();

  try {
    // Prefetch the user's profile data
    // The queryKey must match the one used in useUserProfileQuery
    await queryClient.prefetchQuery({
      queryKey: ['userProfile', user.id], 
      queryFn: getCurrentUserProfile,
    });
  } catch (error) {
    console.error("Failed to prefetch user profile for dashboard:", error);
    // Optionally, handle this error, e.g., by not dehydrating or
    // by setting up a way for the client component to show a specific error state.
    // For now, we'll proceed and let the client-side useQuery handle its own error state.
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardHomePage />
    </HydrationBoundary>
  );
}
