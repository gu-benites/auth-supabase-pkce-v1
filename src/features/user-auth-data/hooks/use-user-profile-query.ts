
// src/features/profile/hooks/use-user-profile-query.ts
'use client';

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { getCurrentUserProfile } from '../queries/profile.queries';
import { type UserProfile } from '../schemas/profile.schema';

interface UseUserProfileQueryOptions {
  // The userId is used to enable/disable the query and as part of the query key.
  // Pass null or undefined if no user is authenticated.
  userId: string | null | undefined; 
}
const getTimestampLog = () => new Date().toISOString();

/**
 * Custom hook to fetch the current user's profile using TanStack Query.
 *
 * @param options - Options for the hook, primarily the userId.
 * @param options.userId - The ID of the user whose profile is to be fetched.
 *                         Query is enabled only if userId is provided.
 * @returns An object containing the user profile data, loading state, error state, etc.
 *          See TanStack Query's UseQueryResult type for details.
 *          Specifically, we are interested in:
 *          - `data` (renamed to `profile`): UserProfile | undefined
 *          - `isLoading`: boolean
 *          - `isError`: boolean
 *          - `error`: Error | null
 */
export const useUserProfileQuery = (
  options: UseUserProfileQueryOptions,
): UseQueryResult<UserProfile, Error> & { profile?: UserProfile } => {
  const { userId } = options;
  console.log(`[${getTimestampLog()}] useUserProfileQuery (Client): Hook called. userId: ${userId}, enabled: ${!!userId}`);

  const queryResult = useQuery<UserProfile, Error, UserProfile, (string | null | undefined)[]>({
    queryKey: ['userProfile', userId],
    queryFn: async () => {
      console.log(`[${getTimestampLog()}] useUserProfileQuery (Client): queryFn executing for userId: ${userId}. Calling getCurrentUserProfile.`);
      const profile = await getCurrentUserProfile();
      console.log(`[${getTimestampLog()}] useUserProfileQuery (Client): queryFn received profile:`, profile ? 'Data received' : 'No data');
      return profile;
    },
    enabled: !!userId, // Only run the query if userId is available
    staleTime: 1000 * 60 * 5, // Cache profile data for 5 minutes
    // Add other TanStack Query options as needed, e.g., gcTime, refetchOnWindowFocus
  });

  console.log(`[${getTimestampLog()}] useUserProfileQuery (Client): Query result for userId ${userId}:`, {
    status: queryResult.status,
    isLoading: queryResult.isLoading,
    isFetching: queryResult.isFetching,
    isSuccess: queryResult.isSuccess,
    isStale: queryResult.isStale,
    dataExists: !!queryResult.data,
    error: queryResult.error?.message,
  });

  return {
    ...queryResult,
    profile: queryResult.data, // Alias data to profile for convenience
  };
};
