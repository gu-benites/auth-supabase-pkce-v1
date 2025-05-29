// src/components/providers/auth-state-provider.tsx
// This file is no longer needed as its responsibilities have been superseded by:
// 1. `src/components/providers/auth-session-provider.tsx` (for React Context based raw session)
// 2. The new `useAuth` hook at `src/features/auth/hooks/use-auth.ts` (which combines context and TanStack Query for profile)
//
// The Zustand store (`src/stores/auth.store.ts`) has also been refactored to remove
// core auth logic and its `initializeAuthListener`.
//
// You can safely delete this file.

/**
 * @deprecated This component is no longer in use and can be deleted.
 * Authentication state is now managed by AuthSessionProvider and the new useAuth hook.
 */
export function AuthStateProvider_DEPRECATED({ children }: { children: React.ReactNode }): JSX.Element {
  return <>{children}</>;
}
