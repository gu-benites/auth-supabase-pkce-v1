// src/stores/auth.store.ts
import { create } from 'zustand';

// This store is now for minimal, purely client-side global state
// not directly tied to auth session or server-fetched profile.
// Example: UI preferences, theme, etc.
// For now, we'll keep the original names `AuthState` and `useAuthStore`
// but with all auth-specific content removed.

export interface AuthState {
  // No user, profile, isLoading, isAuthenticated, or error states here.
  // These are now handled by the new useAuth hook and AuthSessionProvider.
  actions: {
    // No auth-specific actions like setUserAndProfile, setLoading, setError, clearAuth, fetchUserProfile.
    // Add any non-auth global client-side actions here if needed in the future.
    // Example: toggleTheme: () => void;
  };
}

/**
 * Zustand store for managing global application state (non-auth related).
 * Currently a placeholder if no other global client-side state is needed.
 */
export const useAuthStore = create<AuthState>((set, get) => ({
  // No initial state for user, profile, isLoading, isAuthenticated, error.
  actions: {
    // Implementations for any non-auth global actions would go here.
    // Example: toggleTheme: () => set(state => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
  },
}));

// The initializeAuthListener function has been removed as it's no longer relevant
// for this store. Auth state changes are handled by AuthSessionProvider.

// The old useAuth hook that was part of this store has been removed.
// A new useAuth hook is now in src/features/auth/hooks/use-auth.ts.
