// src/providers/auth-session-provider.tsx
'use client';

import { type User } from '@supabase/supabase-js';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { createClient } from '@/lib/supabase/client';

interface AuthSessionContextType {
  user: User | null;
  isLoading: boolean; // This isLoading reflects the initial session check and ongoing auth changes.
  error: Error | null;
}

const AuthSessionContext = createContext<AuthSessionContextType | undefined>(
  undefined,
);

const getTimestamp = () => new Date().toISOString();

/**
 * Provides the Supabase user session to its children components via React Context.
 * It listens to Supabase's onAuthStateChange to keep the session state updated.
 * The `isLoading` state tracks the completion of the initial session check.
 *
 * @param {object} props - The component's props.
 * @param {ReactNode} props.children - The child components to render.
 * @returns {JSX.Element} The provider component.
 */
export const AuthSessionProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [supabaseClient] = useState(() => createClient());

  useEffect(() => {
    let isMounted = true;
    let loadingFallbackTimeoutId: NodeJS.Timeout | null = null;

    console.log(`[${getTimestamp()}] AuthSessionProvider: useEffect mounting or supabaseClient changed.`);

    const initializeSession = async () => {
      try {
        // Try to get the user and session initially
        const { data: { user: initialUser }, error: initialError } = await supabaseClient.auth.getUser();
        if (!isMounted) return;

        if (initialError) {
          console.error(`[${getTimestamp()}] AuthSessionProvider: Error during initial getUser():`, initialError);
          setError(initialError);
          setUser(null);
        } else if (initialUser) {
          console.log(`[${getTimestamp()}] AuthSessionProvider: User from initial getUser():`, initialUser);
          setUser(initialUser);
        }
      } catch (catchedError) {
        if (!isMounted) return;
        console.error(`[${getTimestamp()}] AuthSessionProvider: Exception during initial getUser():`, catchedError);
        setError(catchedError instanceof Error ? catchedError : new Error('Unknown error during getUser'));
        setUser(null);
      } finally {
        // Important: Set isLoading to false after the initial check,
        // but rely on onAuthStateChange for the most definitive "INITIAL_SESSION" signal.
        // If onAuthStateChange fires quickly with INITIAL_SESSION, this might be redundant or slightly premature.
        // The timeout fallback is crucial.
      }
    };

    initializeSession();

    const { data: { subscription: authSubscription } } = supabaseClient.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;
        
        console.log(`[${getTimestamp()}] AuthSessionProvider: onAuthStateChange event:`, event, "Session user:", session?.user);
        setUser(session?.user ?? null);
        setError(null); // Clear previous errors on new auth state

        if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          if (loadingFallbackTimeoutId) {
            clearTimeout(loadingFallbackTimeoutId); 
            loadingFallbackTimeoutId = null;
          }
          if (isLoading) {
            console.log(`[${getTimestamp()}] AuthSessionProvider: Setting isLoading to false due to auth event:`, event);
            setIsLoading(false);
          }
        }
      }
    );
    
    if (isLoading) {
        loadingFallbackTimeoutId = setTimeout(() => {
            if (isMounted && isLoading) { 
                console.warn(`[${getTimestamp()}] AuthSessionProvider: isLoading fallback timeout. Forcing isLoading to false.`);
                setIsLoading(false);
            }
        }, 2500); 
    }

    return () => {
      isMounted = false;
      authSubscription?.unsubscribe();
      if (loadingFallbackTimeoutId) {
        clearTimeout(loadingFallbackTimeoutId);
      }
      console.log(`[${getTimestamp()}] AuthSessionProvider: useEffect cleanup.`);
    };
  }, [supabaseClient]); // supabaseClient should be stable

  return (
    <AuthSessionContext.Provider value={{ user, isLoading, error }}>
      {children}
    </AuthSessionContext.Provider>
  );
};

/**
 * Custom hook to consume the authentication session context.
 * Throws an error if used outside of an AuthSessionProvider.
 *
 * @returns {AuthSessionContextType} The authentication session context (user, isLoading for initial session, error).
 */
export const useAuthSession = (): AuthSessionContextType => {
  const context = useContext(AuthSessionContext);
  if (context === undefined) {
    throw new Error('useAuthSession must be used within an AuthSessionProvider');
  }
  return context;
};
