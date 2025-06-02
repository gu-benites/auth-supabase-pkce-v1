// src/app/page.tsx
import { HomepageLayout } from '@/features/homepage/layout'; // Updated import path
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';
import { getCurrentUserProfile } from '@/features/user-auth-data/queries'; 
import { createClient } from '@/lib/supabase/server';
import { getServerLogger } from '@/lib/logger';

const logger = getServerLogger('RootPage');
const getTimestampLog = () => new Date().toISOString();

/**
 * Renders the main homepage of the PassForge application.
 * This component serves as the entry point for the '/' route.
 * It renders the HomepageLayout component, which contains the actual structure and content of the homepage.
 * If a user is authenticated, it attempts to prefetch their profile data on the server
 * to make it available for client-side hydration, benefiting components like HeroHeader.
 *
 * @returns {Promise<JSX.Element>} The homepage component.
 */
export default async function RootPage(): Promise<JSX.Element> {
  const queryClient = new QueryClient();
  const supabase = await createClient();
  // Fetch the user session on the server
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError) {
    logger.error(`[${getTimestampLog()}] RootPage (Server): Error fetching user session.`, { error: userError.message });
    // Continue rendering homepage as public, HeroHeader will adapt.
  }

  if (user) {
    logger.info(`[${getTimestampLog()}] RootPage (Server): User ${user.id} is authenticated. Attempting to prefetch profile.`);
    try {
      await queryClient.prefetchQuery({
        queryKey: ['userProfile', user.id],
        queryFn: getCurrentUserProfile,
      });
      logger.info(`[${getTimestampLog()}] RootPage (Server): Successfully prefetched user profile for ${user.id}.`);
    } catch (error) {
      const castError = error instanceof Error ? error : new Error(String(error));
      // Log the error, but don't block rendering. The client-side query will handle fetching if prefetch fails.
      logger.error(`[${getTimestampLog()}] RootPage (Server): FAILED to prefetch user profile for ${user.id}.`, { error: castError.message, stack: castError.stack });
    }
  } else {
    logger.info(`[${getTimestampLog()}] RootPage (Server): No authenticated user. Skipping profile prefetch for homepage.`);
  }

  const dehydratedState = dehydrate(queryClient);
  if (user) { // Log dehydrated state only if we attempted to prefetch
    logger.info(`[${getTimestampLog()}] RootPage (Server): Dehydrated state for user ${user.id}:`, JSON.stringify(dehydratedState, null, 2).substring(0, 300) + '...');
  }


  return (
    <HydrationBoundary state={dehydratedState}>
      <HomepageLayout />
    </HydrationBoundary>
  );
}
