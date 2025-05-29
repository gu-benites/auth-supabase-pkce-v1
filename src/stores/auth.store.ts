// src/stores/auth.store.ts
import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client'; // Client-side Supabase instance

/**
 * Defines the structure for a user's profile data, typically from a dedicated 'profiles' table.
 * This is distinct from `user_metadata` which is simpler key-value data directly on the `auth.users` table.
 */
export interface UserProfile {
  id: string; // Should match the auth.users.id
  username?: string | null;
  avatar_url?: string | null;
  // Add other profile fields from your 'profiles' table
}

/**
 * Defines the shape of the authentication state managed by Zustand.
 */
export interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: Error | null;
  actions: {
    setUserAndProfile: (user: User | null, profileData?: Partial<UserProfile> | null) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: Error | null) => void;
    clearAuth: () => void;
    fetchUserProfile: (userId: string) => Promise<void>;
  };
}

const supabase = createClient(); // Use the client-side Supabase instance

/**
 * Zustand store for managing global authentication state.
 */
export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  isLoading: true, // Start true to check initial session
  isAuthenticated: false,
  error: null,
  actions: {
    /**
     * Sets the authenticated user and their profile data in the store.
     * It intelligently combines `user_metadata` with data from a dedicated `profiles` table.
     * @param {User | null} user - The Supabase user object, or null if logged out.
     * @param {Partial<UserProfile> | null} [profileData] - Optional data from the 'profiles' table.
     */
    setUserAndProfile: (user, profileData = null) => {
      let combinedProfile: UserProfile | null = null;
      if (user) {
        combinedProfile = {
          id: user.id,
          // Prioritize data from a dedicated 'profiles' table if provided
          username: profileData?.username ?? user.user_metadata?.username ?? null,
          avatar_url: profileData?.avatar_url ?? user.user_metadata?.avatar_url ?? null,
          // Fallback or supplement with user_metadata if needed and not in profileData
          // Example: if 'firstName' isn't in your UserProfile from the table, but is in metadata
          // firstName: user.user_metadata?.first_name,
          // lastName: user.user_metadata?.last_name,
          // Ensure all properties defined in UserProfile are handled or defaulted to null/undefined
          ...(profileData || {}),
        };
      }

      set({
        user,
        profile: combinedProfile,
        isAuthenticated: !!user,
        isLoading: false, // Assuming loading is false once user/profile is set or cleared
        error: null,
      });
    },
    /**
     * Sets the loading state.
     * @param {boolean} loading - The new loading state.
     */
    setLoading: (loading) => set({ isLoading: loading }),
    /**
     * Sets an error state.
     * @param {Error | null} error - The error object, or null to clear.
     */
    setError: (error) => set({ error, isLoading: false }),
    /**
     * Clears all authentication state (user, profile, error) and sets isAuthenticated to false.
     */
    clearAuth: () => {
      set({
        user: null,
        profile: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    },
    /**
     * Fetches the user's profile data from the 'profiles' table in Supabase.
     * This assumes a 'profiles' table exists with RLS policies allowing users to read their own profile.
     * @param {string} userId - The ID of the user whose profile is to be fetched.
     */
    fetchUserProfile: async (userId: string) => {
      if (!userId) {
        // If called without a userId, ensure profile is cleared, or do nothing if user isn't set yet.
        // This scenario might occur if onAuthStateChange fires with a null session after a profile was loaded.
        const currentUser = get().user;
        if (!currentUser) set({ profile: null });
        return;
      }
      try {
        // Consider a separate profileLoading state if granular loading indicators are needed
        set(state => ({ ...state, isLoading: true }));


        const { data: profileTableData, error: profileError } = await supabase
          .from('profiles') // Replace 'profiles' with your actual table name
          .select('username, avatar_url') // Select only fields defined in UserProfile from 'profiles' table
          .eq('id', userId)
          .single();

        if (profileError && profileError.code !== 'PGRST116') { // PGRST116: 0 rows means no profile, not necessarily an error
            console.error('Error fetching user profile from table:', profileError);
            // We might still want to set the user from auth, so don't throw yet.
            // The profile part will be null or from metadata.
        }
        
        const currentUser = get().user; // Get current user from store (contains user_metadata)
        if (currentUser) {
          // Call setUserAndProfile to update both user and profile state
          // It handles merging user_metadata with profileTableData
          get().actions.setUserAndProfile(currentUser, profileTableData as Partial<UserProfile> | null);
        } else {
           // This case is unlikely if fetchUserProfile is called after user is set, but good for safety
           set({ profile: profileTableData as UserProfile | null, isLoading: false });
        }

      } catch (e) {
        console.error('Error in fetchUserProfile:', e);
        set({ error: e as Error, profile: null, isLoading: false });
      }
    },
  },
}));

/**
 * Initializes the Supabase authentication listener.
 * This should be called once when the application mounts (e.g., in a root provider).
 * It subscribes to auth state changes and updates the Zustand store accordingly.
 * @returns {() => void} An unsubscribe function to clean up the listener.
 */
export function initializeAuthListener() {
  const { setUserAndProfile, clearAuth, fetchUserProfile, setLoading } = useAuthStore.getState().actions;

  setLoading(true); // Set initial loading state

  supabase.auth.getSession().then(async ({ data: { session } }) => {
    const user = session?.user ?? null;
    if (user) {
      setUserAndProfile(user); // Set user first (includes metadata)
      await fetchUserProfile(user.id); // Then attempt to fetch extended profile
    } else {
      clearAuth(); // Clears user, profile, sets isAuthenticated to false
    }
    setLoading(false); // Loading is false after initial check
  }).catch(error => {
    console.error("Error in initial getSession:", error);
    get().actions.setError(error as Error);
    setLoading(false);
  });

  const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
    setLoading(true);
    const user = session?.user ?? null;
    if (user) {
      setUserAndProfile(user);
      await fetchUserProfile(user.id);
    } else {
      clearAuth();
    }
    setLoading(false);
  });

  return () => {
    authListener?.unsubscribe();
  };
}

/**
 * Custom hook for easy access to authentication state and actions from the Zustand store.
 * @returns {object} An object containing user, profile, isLoading, isAuthenticated, error, and actions.
 * Also exposes `userMetadata` directly from the user object.
 */
export const useAuth = () => {
  const store = useAuthStore();
  return {
    user: store.user,
    profile: store.profile,
    isLoading: store.isLoading,
    isAuthenticated: store.isAuthenticated,
    error: store.error,
    actions: store.actions,
    userMetadata: store.user?.user_metadata, // Convenience accessor for user_metadata
  };
};
