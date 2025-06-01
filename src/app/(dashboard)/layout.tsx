
import { DashboardLayout as DashboardLayoutComponent } from '@/features/dashboard/components/dashboard-layout'; // Renamed to avoid conflict
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';
import { getCurrentUserProfile } from '@/features/user-profile/queries';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getServerLogger } from '@/lib/logger';

const logger = getServerLogger('DashboardLayout');

/**
 * Shared layout for all routes within the (dashboard) group.
 * This layout is responsible for:
 * 1. Applying the main visual shell (DashboardLayoutComponent).
 * 2. Prefetching common data, like the user profile, for all dashboard pages.
 *    This data is then passed to the client via HydrationBoundary.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // This should ideally be caught by middleware, but good to have a fallback.
    logger.warn('No authenticated user found in dashboard layout. Redirecting to login.');
    redirect('/login?message=Please log in to access the dashboard.');
  }

  const queryClient = new QueryClient();

  try {
    logger.info(`Prefetching user profile for user ID: ${user.id} in dashboard layout.`);
    await queryClient.prefetchQuery({
      queryKey: ['userProfile', user.id],
      queryFn: getCurrentUserProfile, // This is the server action
    });
    logger.info(`Successfully prefetched user profile for user ID: ${user.id}.`);
  } catch (error) {
    // Log the error but don't block rendering. The client-side useUserProfileQuery will attempt to fetch.
    logger.error('Failed to prefetch user profile in dashboard layout.', { userId: user.id, error });
    // Sentry.captureException(error, { extra: { context: 'DashboardLayout Prefetch', userId: user.id }}); // Optional: Send to Sentry
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardLayoutComponent>{children}</DashboardLayoutComponent>
    </HydrationBoundary>
  );
}
