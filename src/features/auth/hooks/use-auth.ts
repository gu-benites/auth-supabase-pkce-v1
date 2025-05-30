// src/features/auth/hooks/use-auth.ts
'use client';

import { useAuthSession } from '@/providers'; // Updated import path
import { useUserProfileQuery } from '@/features/profile/hooks/use-user-profile-query';
import { type UserProfile } from '@/features/profile/schemas/profile.schema';
import { type User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  profile: UserProfile | undefined;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | null;
}

/**
 * The primary hook for accessing authentication state and user profile information.
 * It combines the session state (raw Supabase user) from AuthSessionContext
 * with the detailed user profile fetched via TanStack Query (useUserProfileQuery).
 *
 * @returns {AuthState} An AuthState object containing:
 *  - `user`: The raw Supabase User object, or null if not authenticated.
 *  - `profile`: The detailed UserProfile object, or undefined if not loaded or not authenticated.
 *  - `isAuthenticated`: Boolean indicating if a user session exists.
 *  - `isLoading`: Boolean indicating if session or profile data is currently loading.
 *  - `error`: An Error object if an error occurred during session or profile fetching.
 */
export const useAuth = (): AuthState => {
  const { user, isLoading: isSessionLoading, error: sessionError } = useAuthSession();
  
  const { 
    profile, 
    isLoading: isProfileLoading, 
    isError: isProfileError, 
    error: profileError 
  } = useUserProfileQuery({
    userId: user?.id, // Query is enabled only if user.id exists
  });

  const isAuthenticated = !!user;

  // isLoading is true if the session is loading, or if the user is authenticated and the profile is loading.
  const isLoading = isSessionLoading || (isAuthenticated && isProfileLoading);

  // Prioritize sessionError, then profileError
  let error: Error | null = null;
  if (sessionError) {
    error = sessionError;
  } else if (isProfileError && profileError) {
    // Only consider profile error if a user is authenticated, otherwise session state is king
    if (isAuthenticated) {
      error = profileError;
    }
  }
  // If there's a profile error but no user (e.g. user signed out while query was running),
  // we might not want to show profile error. Session error/state is more relevant.
  // The logic above already handles this by only setting profileError if isAuthenticated.


  return {
    user,
    profile,
    isAuthenticated,
    isLoading,
    error,
  };
};
