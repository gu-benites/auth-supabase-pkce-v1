// src/stores/auth.store.ts
import { create } from 'zustand';

/**
 * @fileoverview This store is now intended for minimal, purely client-side global state
 * NOT directly tied to auth session or server-fetched profile.
 * Core authentication state (session, user object, profile fetching) is handled by
 * AuthSessionProvider (React Context at src/components/providers/auth-session-provider.tsx)
 * and the useAuth hook (at src/features/auth/hooks/use-auth.ts), which leverages
 * TanStack Query for profile data.
 *
 * This file can be used for other global client-side state, such as UI preferences,
 * theme settings, or application-wide toggles not managed by server data.
 */

// Example of a non-auth related global state slice:
interface GlobalSettingsState {
  theme: 'light' | 'dark' | 'system';
  // Add other global, client-side settings here
  actions: {
    setTheme: (theme: 'light' | 'dark' | 'system') => void;
  };
}

/**
 * Zustand store for managing global application settings.
 * This is an example of how this file can be used for non-authentication related global state.
 */
export const useGlobalSettingsStore = create<GlobalSettingsState>((set) => ({
  theme: 'system', // Default theme
  actions: {
    setTheme: (theme) => set({ theme }),
  },
}));

/**
 * @deprecated The useAuth hook and initializeAuthListener previously in this file
 * are now superseded by the AuthSessionProvider (src/components/providers/auth-session-provider.tsx)
 * and the useAuth hook located in src/features/auth/hooks/use-auth.ts.
 * This store should only be used for non-authentication related global client-side state.
 */
// Old auth-related state, actions, and listener have been removed to align with
// the recommended architecture where AuthSessionProvider and React Query (via useAuth hook)
// manage core authentication and profile data.
