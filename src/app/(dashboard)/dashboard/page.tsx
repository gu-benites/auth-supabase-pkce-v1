
// src/app/(dashboard)/dashboard/page.tsx

import { DashboardHomepageView } from '@/features/dashboard/dashboard-homepage';
// HydrationBoundary, QueryClient, dehydrate, getCurrentUserProfile, createClient, redirect removed for now

/**
 * Server Component for the main dashboard page (/dashboard).
 * For design verification, prefetching and server-side auth checks are temporarily removed.
 * It now simply renders the DashboardHomepageView.
 *
 * @returns {Promise<JSX.Element>} The dashboard page component.
 */
export default async function DashboardPage(): Promise<JSX.Element> {
  // Server-side auth check and prefetching removed temporarily
  // const supabase = await createClient();
  // const { data: { user } } = await supabase.auth.getUser();

  // if (!user) {
  //   redirect('/login?message=Please log in to view your dashboard.');
  // }

  // const queryClient = new QueryClient();

  // try {
  //   await queryClient.prefetchQuery({
  //     queryKey: ['userProfile', user.id],
  //     queryFn: getCurrentUserProfile,
  //   });
  // } catch (error) {
  //   console.error("Failed to prefetch user profile for dashboard:", error);
  // }

  return (
    // <HydrationBoundary state={dehydrate(queryClient)}> // HydrationBoundary removed
      <DashboardHomepageView />
    // </HydrationBoundary>
  );
}
