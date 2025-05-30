// src/features/auth/hooks/use-auth.ts
'use client';

import { useAuthSession } from '@/providers';
import { useUserProfileQuery } from '@/features/profile/hooks/use-user-profile-query';
import { type UserProfile } from '@/features/profile/schemas/profile.schema';
import { type User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  profile: UserProfile | undefined;
  isAuthenticated: boolean;
  isLoading: boolean; // Composite loading (session OR profile if user exists)
  error: Error | null; // Composite error (session OR profile if user exists)
  isSessionLoading: boolean; // Specifically for AuthSessionProvider's initial check
  sessionError: Error | null; // Specifically for errors from AuthSessionProvider
}

/**
 * The primary hook for accessing authentication state and user profile information.
 * It combines the session state (raw Supabase user) from AuthSessionContext
 * with the detailed user profile fetched via TanStack Query (useUserProfileQuery).
 *
 * @returns {AuthState} An AuthState object.
 */
export const useAuth = (): AuthState => {
  const { 
    user, 
    isLoading: currentIsSessionLoading, // Renamed to avoid conflict
    error: currentSessionError // Renamed to avoid conflict
  } = useAuthSession();
  
  const { 
    profile, 
    isLoading: isProfileLoading, 
    isError: isProfileError, 
    error: profileError 
  } = useUserProfileQuery({
    userId: user?.id,
  });

  const isAuthenticated = !!user;

  // Composite isLoading: true if session is loading OR (user is authenticated AND profile is loading).
  const isLoading = currentIsSessionLoading || (isAuthenticated && isProfileLoading);

  // Composite error: Prioritize sessionError, then profileError if authenticated.
  let compositeError: Error | null = null;
  if (currentSessionError) {
    compositeError = currentSessionError;
  } else if (isProfileError && profileError && isAuthenticated) {
    compositeError = profileError;
  }

  return {
    user,
    profile,
    isAuthenticated,
    isLoading, // Composite loading
    error: compositeError, // Composite error
    isSessionLoading: currentIsSessionLoading, // Session-specific loading
    sessionError: currentSessionError, // Session-specific error
  };
};
