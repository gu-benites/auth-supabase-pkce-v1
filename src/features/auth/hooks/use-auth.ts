// src/features/auth/hooks/use-auth.ts
'use client';

import { useAuthSession } from '@/providers';
import { useUserProfileQuery } from '@/features/profile/hooks/use-user-profile-query';
import { type UserProfile } from '@/features/profile/schemas/profile.schema';
import { type User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null; // Raw Supabase user object from session
  profile: UserProfile | undefined; // Detailed user profile data from 'profiles' table
  authUser: (User & UserProfile) | null; // Combined user and profile data, available when fully authenticated
  isAuthenticated: boolean; // Stricter: true only if session exists AND profile is loaded
  isLoadingAuth: boolean; // Composite: true if session is loading OR (session exists AND profile is loading)
  isSessionLoading: boolean; // Specifically for AuthSessionProvider's initial session check
  sessionError: Error | null; // Specifically for errors from AuthSessionProvider
  isProfileLoading: boolean; // Specifically for profile data fetching
  profileError: Error | null; // Specifically for errors from profile data fetching
}

/**
 * The primary hook for accessing authentication state and user profile information.
 * It combines the session state (raw Supabase user) from AuthSessionContext
 * with the detailed user profile fetched via TanStack Query (useUserProfileQuery).
 *
 * @returns {AuthState} An AuthState object with granular loading and authentication states.
 */
export const useAuth = (): AuthState => {
  const { 
    user: sessionUser, 
    isLoading: currentIsSessionLoading,
    error: currentSessionError 
  } = useAuthSession();
  
  const { 
    profile: profileData, 
    isLoading: currentIsProfileLoading, 
    isError: currentIsProfileError, 
    error: currentProfileError 
  } = useUserProfileQuery({
    userId: sessionUser?.id,
  });

  // Is the basic Supabase session authenticated and loaded?
  const isAuthenticatedUserSession = !!sessionUser && !currentIsSessionLoading && !currentSessionError;

  // Is the detailed profile loaded and ready?
  const isProfileReady = !!profileData && !currentIsProfileLoading && !currentProfileError;
  
  // Stricter isAuthenticated: session must exist AND profile must be loaded and ready.
  const isAuthenticated = isAuthenticatedUserSession && isProfileReady;

  // isLoadingAuth: True if session is loading OR (session is established AND profile is still loading).
  const isLoadingAuth = currentIsSessionLoading || (!!sessionUser && currentIsProfileLoading);

  let authUser: (User & UserProfile) | null = null;
  if (isAuthenticated && sessionUser && profileData) {
    // Ensure id and email from sessionUser (auth.users) take precedence
    // as they are the source of truth for identity.
    authUser = { 
      ...sessionUser, 
      ...profileData, 
      id: sessionUser.id, 
      email: sessionUser.email 
    };
  }

  // Composite error: Prioritize sessionError, then profileError if session was okay.
  let compositeError: Error | null = null;
  if (currentSessionError) {
    compositeError = currentSessionError;
  } else if (isAuthenticatedUserSession && currentIsProfileError && currentProfileError) {
    // Only consider profileError if the session itself is fine
    compositeError = currentProfileError;
  }

  return {
    user: sessionUser, // Raw Supabase user
    profile: profileData, // Detailed profile
    authUser, // Combined user and profile when fully authenticated
    isAuthenticated, // Stricter: session AND profile ready
    isLoadingAuth, // Composite loading: session OR (session + profile)
    isSessionLoading: currentIsSessionLoading, // Session-specific loading
    sessionError: currentSessionError, // Session-specific error
    isProfileLoading: currentIsProfileLoading, // Profile-specific loading
    profileError: currentProfileError, // Profile-specific error
  };
};
