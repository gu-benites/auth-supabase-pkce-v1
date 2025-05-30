// src/features/auth/hooks/use-auth.ts
'use client';

import { useAuthSession } from '@/providers';
import { useUserProfileQuery } from '@/features/user-profile/hooks/use-user-profile-query';
import { type UserProfile } from '@/features/user-profile/schemas/profile.schema';
import { type User } from '@supabase/supabase-js';

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
 *
 * - `isLoadingAuth`: Composite flag. True if the session is loading OR (if session exists) the profile is loading.
 * - `isSessionLoading`: True only while the AuthSessionProvider is determining the initial Supabase session.
 * - `isAuthenticated`: Stricter flag. True only if a Supabase session exists AND the detailed user profile has been successfully loaded.
 * - `authUser`: Combined object of Supabase user and detailed profile, available when `isAuthenticated` (stricter definition) is true.
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
    error: currentProfileErrorObj // Renamed to avoid conflict with error from AuthSessionContext
  } = useUserProfileQuery({
    userId: sessionUser?.id,
  });

  // Basic session check: Does a Supabase user object exist and is session loading complete?
  const hasValidSession = !!sessionUser && !currentIsSessionLoading && !currentSessionError;

  // Profile check: Is the detailed profile loaded and ready?
  const isProfileReady = !!profileData && !currentIsProfileLoading && !currentIsProfileError;
  
  // Stricter isAuthenticated: session must exist AND profile must be loaded and ready.
  const finalIsAuthenticated = hasValidSession && isProfileReady;

  // isLoadingAuth: True if session is loading OR (session is established AND profile is still loading).
  const finalIsLoadingAuth = currentIsSessionLoading || (hasValidSession && currentIsProfileLoading);

  let finalAuthUser: (User & UserProfile) | null = null;
  if (finalIsAuthenticated && sessionUser && profileData) {
    // Ensure id and email from sessionUser (auth.users) take precedence
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
    profileError: currentProfileErrorObj, // Use the renamed error variable
  };
};
