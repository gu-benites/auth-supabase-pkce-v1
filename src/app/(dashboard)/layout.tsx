
import { DashboardLayout as DashboardLayoutComponent } from '@/features/dashboard/layout';
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';
import { getCurrentUserProfile } from '@/features/user-auth-data/queries'; // Corrected import path
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getServerLogger } from '@/lib/logger';

const logger = getServerLogger('DashboardLayout');
const getTimestampLog = () => new Date().toISOString();

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
  console.log(`[${getTimestampLog()}] DashboardLayout (Server): Start`);
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError) {
    logger.error('DashboardLayout (Server): Error fetching user from Supabase.', { error: userError.message });
    redirect('/login?message=Session error, please log in again.');
  }

  if (!user) {
    logger.warn('DashboardLayout (Server): No authenticated user found. Redirecting to login.');
    redirect('/login?message=Please log in to access the dashboard.');
  }

  console.log(`[${getTimestampLog()}] DashboardLayout (Server): User ID: ${user.id}`);
  const queryClient = new QueryClient();

  try {
    logger.info(`DashboardLayout (Server): PREFETCHING user profile for user ID: ${user.id}.`);
    console.log(`[${getTimestampLog()}] DashboardLayout (Server): PREFETCHING user profile for user ID: ${user.id}.`);
    await queryClient.prefetchQuery({
      queryKey: ['userProfile', user.id],
      queryFn: getCurrentUserProfile,
    });
    logger.info(`DashboardLayout (Server): SUCCESSFULLY PREFETCHED user profile for user ID: ${user.id}.`);
    console.log(`[${getTimestampLog()}] DashboardLayout (Server): SUCCESSFULLY PREFETCHED user profile for user ID: ${user.id}.`);
  } catch (error) {
    const castError = error instanceof Error ? error : new Error(String(error));
    logger.error('DashboardLayout (Server): FAILED to prefetch user profile.', { userId: user.id, error: castError.message, stack: castError.stack });
    console.error(`[${getTimestampLog()}] DashboardLayout (Server): FAILED to prefetch user profile for user ID: ${user.id}. Error: ${castError.message}`);
  }

  const dehydratedState = dehydrate(queryClient);
  console.log(`[${getTimestampLog()}] DashboardLayout (Server): Dehydrated state:`, JSON.stringify(dehydratedState, null, 2).substring(0, 500) + '...');

  return (
    <HydrationBoundary state={dehydratedState}>
      <DashboardLayoutComponent>{children}</DashboardLayoutComponent>
    </HydrationBoundary>
  );
}
