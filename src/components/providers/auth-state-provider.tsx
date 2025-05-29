// src/components/providers/auth-state-provider.tsx
'use client';

import { useEffect, type ReactNode } from 'react';
import { initializeAuthListener } from '@/stores/auth.store'; // Adjust path if needed

/**
 * Provides authentication state to the application by initializing the Supabase auth listener.
 * This component should wrap the main application content.
 *
 * @param {object} props - The component's props.
 * @param {ReactNode} props.children - The child components to render.
 * @returns {JSX.Element} The provider component.
 */
export function AuthStateProvider({ children }: { children: ReactNode }): JSX.Element {
  useEffect(() => {
    const unsubscribe = initializeAuthListener();
    // Cleanup listener on component unmount
    return () => {
      unsubscribe();
    };
  }, []); // Empty dependency array ensures this runs only once on mount and unmount

  return <>{children}</>;
}
