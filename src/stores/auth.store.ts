// src/stores/auth.store.ts
import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client'; // Added missing import

// Define a type for your user profile if you have one in a separate Supabase table
// This is distinct from user_metadata which is simpler key-value data.
// Based on consultant feedback, this UserProfile and fetchUserProfile will be removed/refactored
// if profile data fetching is fully delegated to TanStack Query.
// For now, keeping a simplified version or placeholder if the store is to be minimized.
interface UserProfile {
  id: string; // Should match the auth.users.id
  username?: string;
  avatar_url?: string;
  first_name?: string; // From user_metadata typically
  last_name?: string;  // From user_metadata typically
  // Add other profile fields from your 'profiles' table if you were to use this model
}

export interface AuthState {
  user: User | null;
  // profile: UserProfile | null; // Removed as per previous step to align with consultant (profile fetching via TanStack Query)
  isLoading: boolean; // This is for the auth listener part
  isAuthenticated: boolean;
  error: Error | null; // For auth listener errors
  actions: {
    setUserOnly: (user: User | null) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: Error | null) => void;
    clearAuth: () => void;
    // fetchUserProfile action removed
  };
}

/**
 * Zustand store for managing global authentication state.
 * This store listens to Supabase auth changes and provides reactive state
 * for the user object, authentication status, and loading/error states related
 * to the auth listener.
 *
 * As per consultant feedback, fetching detailed user profiles (beyond user_metadata)
 * should be handled by TanStack Query. This store focuses on the raw session user
 * and its immediate status.
 */
export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  // profile: null, // Removed
  isLoading: true, // Start true to check initial session
  isAuthenticated: false,
  error: null,
  actions: {
    /**
     * Sets the user object and updates authentication status.
     * @param {User | null} user - The Supabase user object or null.
     */
    setUserOnly: (user) => {
      set({
        user,
        isAuthenticated: !!user,
        isLoading: false, 
        error: null,
      });
    },
    /**
     * Sets the loading state for the auth listener.
     * @param {boolean} loading - The loading state.
     */
    setLoading: (loading) => set({ isLoading: loading }),
    /**
     * Sets an error state, typically from the auth listener.
     * @param {Error | null} error - The error object or null.
     */
    setError: (error) => set({ error, isLoading: false }),
    /**
     * Clears all authentication state (user, isAuthenticated, error).
     */
    clearAuth: () => {
      set({
        user: null,
        // profile: null, // Removed
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    },
  },
}));

/**
 * Initializes the Supabase authentication listener.
 * Subscribes to `onAuthStateChange` and updates the Zustand store accordingly.
 * Should be called once when the application mounts (e.g., in `AuthStateProvider`).
 *
 * @returns {() => void} A function to unsubscribe the auth listener.
 */
export function initializeAuthListener() {
  const { setUserOnly, clearAuth, setLoading, setError } = useAuthStore.getState().actions;
  const supabase = createClient(); // Use the client-side Supabase instance

  setLoading(true); // Set initial loading

  supabase.auth.getSession().then(async ({ data: { session } }) => {
    if (session?.user) {
      setUserOnly(session.user);
    } else {
      clearAuth();
    }
    setLoading(false);
  }).catch(e => {
    console.error("Error getting initial session:", e);
    setError(e as Error); // Set error state
    setLoading(false); // Ensure loading is false on error
  });

  const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
    const user = session?.user ?? null;
    // Do not set isLoading:true here as it might cause UI flicker on every auth change.
    // The initial loading state is handled by getSession and the provider.
    if (user) {
      setUserOnly(user);
    } else {
      clearAuth();
    }
  });

  return () => {
    authListener?.unsubscribe();
  };
}

/**
 * Custom hook for easy access to authentication state and actions from the Zustand store.
 * Provides the current user, authentication status, loading state, error state,
 * user metadata, and store actions.
 *
 * @returns {object} An object containing:
 *  - `user`: The Supabase user object or null.
 *  - `isLoading`: Boolean indicating if the auth listener is initially loading the session.
 *  - `isAuthenticated`: Boolean indicating if the user is authenticated.
 *  - `error`: Error object if an auth listener error occurred, or null.
 *  - `actions`: Object containing store actions (`setUserOnly`, `setLoading`, `setError`, `clearAuth`).
 *  - `userMetadata`: The `user_metadata` object from the Supabase user, or undefined.
 */
export const useAuth = () => useAuthStore((state) => ({
    user: state.user,
    isLoading: state.isLoading,
    isAuthenticated: state.isAuthenticated,
    error: state.error,
    actions: state.actions,
    userMetadata: state.user?.user_metadata,
}));
