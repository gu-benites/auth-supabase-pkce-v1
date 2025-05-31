// src/features/auth/hooks/use-auth.ts
'use client';

import { useEffect } from 'react';
import { useAuthSession } from '@/providers';
import { useUserProfileQuery } from '@/features/user-profile/hooks/use-user-profile-query';
import { type UserProfile } from '@/features/user-profile/schemas/profile.schema';
import { type User } from '@supabase/supabase-js';
import * as Sentry from '@sentry/nextjs';

interface AuthState {
  user: User | null;
  profile: UserProfile | undefined;
  authUser: (User & UserProfile) | null; // Combined user and profile, available when fully authenticated
  isAuthenticated: boolean; // Stricter: true only if session exists AND profile is loaded
  isLoadingAuth: boolean; // Composite: true if session is loading OR (session exists AND profile is loading)
  isSessionLoading: boolean; // Specifically for AuthSessionProvider's initial session check
  sessionError: Error | null; // Specifically for errors from AuthSessionProvider
  isProfileLoading: boolean; // Specifically for profile data fetching
  profileError: Error | null; // Specifically for errors from profile data fetching
}

/**
 * The primary hook for accessing authentication state and user profile information.
 * It combines the session state (raw Supabase user from AuthSessionProvider)
 * with the detailed user profile fetched via TanStack Query (useUserProfileQuery).
 * Also logs significant session or profile errors to Sentry.
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
    error: currentProfileErrorObj 
  } = useUserProfileQuery({
    userId: sessionUser?.id,
  });

  useEffect(() => {
    if (currentSessionError) {
      Sentry.captureException(currentSessionError, {
        tags: { hook: 'useAuth', type: 'sessionLoading' },
        extra: { message: "Error from AuthSessionProvider" }
      });
    }
  }, [currentSessionError]);

  useEffect(() => {
    if (currentProfileErrorObj && sessionUser) { // Only log profile errors if a user session was expected
      Sentry.captureException(currentProfileErrorObj, {
        tags: { hook: 'useAuth', type: 'profileLoading' },
        extra: { userId: sessionUser.id, message: "Error from useUserProfileQuery" },
      });
    }
  }, [currentProfileErrorObj, sessionUser]);

  const hasValidSession = !!sessionUser && !currentIsSessionLoading && !currentSessionError;
  const isProfileReady = !!profileData && !currentIsProfileLoading && !currentIsProfileError;
  const finalIsAuthenticated = hasValidSession && isProfileReady;
  const finalIsLoadingAuth = currentIsSessionLoading || (hasValidSession && currentIsProfileLoading);

  let finalAuthUser: (User & UserProfile) | null = null;
  if (finalIsAuthenticated && sessionUser && profileData) {
    finalAuthUser = { 
      ...sessionUser, 
      ...profileData, 
      id: sessionUser.id, 
      email: sessionUser.email 
    };
  }
  
  return {
    user: sessionUser,
    profile: profileData,
    authUser: finalAuthUser,
    isAuthenticated: finalIsAuthenticated,
    isLoadingAuth: finalIsLoadingAuth,
    isSessionLoading: currentIsSessionLoading,
    sessionError: currentSessionError,
    isProfileLoading: currentIsProfileLoading,
    profileError: currentProfileErrorObj, 
  };
};
