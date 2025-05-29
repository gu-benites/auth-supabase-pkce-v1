// src/stores/auth.store.ts
import { create } from 'zustand';

// This store is now intended for minimal, purely client-side global state
// NOT directly tied to auth session or server-fetched profile.
// Example: theme settings, global UI toggles, etc.
// Core authentication state is now handled by AuthSessionProvider (React Context)
// and the useAuth hook in @/features/auth/hooks which uses TanStack Query for profile data.

// Example of a non-auth related global state slice:
interface GlobalSettingsState {
  theme: 'light' | 'dark' | 'system';
  // Add other global, client-side settings here
  actions: {
    setTheme: (theme: 'light' | 'dark' | 'system') => void;
  };
}

export const useGlobalSettingsStore = create<GlobalSettingsState>((set) => ({
  theme: 'system', // Default theme
  actions: {
    setTheme: (theme) => set({ theme }),
  },
}));

/**
 * @deprecated The useAuth hook and initializeAuthListener previously in this file
 * are now superseded by the AuthSessionProvider and the useAuth hook
 * located in src/features/auth/hooks/use-auth.ts.
 * This store should only be used for non-authentication related global client-side state.
 */
// Old auth-related code has been removed.
// If you need a Zustand store for other global client-side state,
// you can define it here using a pattern similar to useGlobalSettingsStore above.
// For now, this file can be considered a placeholder or be removed if no other
// global client-side state (managed by Zustand) is immediately needed.
