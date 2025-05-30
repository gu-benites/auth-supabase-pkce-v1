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
  isLoading: boolean; // This isLoading reflects the initial session check.
  error: Error | null;
}

const AuthSessionContext = createContext<AuthSessionContextType | undefined>(
  undefined,
);

/**
 * Provides the Supabase user session to its children components via React Context.
 * It listens to Supabase's onAuthStateChange to keep the session state updated.
 * The `isLoading` state specifically tracks the completion of the initial session check.
 *
 * @param {object} props - The component's props.
 * @param {ReactNode} props.children - The child components to render.
 * @returns {JSX.Element} The provider component.
 */
export const AuthSessionProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start true, set to false once initial auth state is known
  const [error, setError] = useState<Error | null>(null);
  // Instantiate client stably using useState's initializer function
  const [supabaseClient] = useState(() => createClient());

  useEffect(() => {
    let isMounted = true;
    let loadingFallbackTimeoutId: NodeJS.Timeout | null = null;

    // Attempt to get the current session state when the provider mounts.
    // This helps catch existing sessions or sessions established by server-side redirects.
    supabaseClient.auth.getSession().then(({ data: { session }, error: sessionError }) => {
      if (!isMounted) return;

      if (sessionError) {
        console.error("AuthSessionProvider: Error during initial getSession():", sessionError);
        setError(sessionError);
        // Potentially set user to null if error implies no valid session
        setUser(null);
      } else if (session) {
        console.log("AuthSessionProvider: User from initial getSession():", session.user);
        setUser(session.user);
      }
      // Do not set isLoading to false here yet; wait for onAuthStateChange's INITIAL_SESSION event
      // or the fallback timeout for a more definitive signal.
    }).catch(catchedError => {
      if (!isMounted) return;
      console.error("AuthSessionProvider: Exception during initial getSession():", catchedError);
      setError(catchedError instanceof Error ? catchedError : new Error('Unknown error during getSession'));
      setUser(null);
    });

    // Set up the auth state change listener
    const { data: authListener } = supabaseClient.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;
        
        console.log("AuthSessionProvider: onAuthStateChange event:", event, "Session user:", session?.user);
        setUser(session?.user ?? null);
        setError(null); // Clear previous errors on new auth state

        // Once we get an event that clarifies the session state (INITIAL_SESSION, SIGNED_IN, SIGNED_OUT),
        // we can confidently say the initial loading is complete.
        if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          if (loadingFallbackTimeoutId) {
            clearTimeout(loadingFallbackTimeoutId); // Clear fallback if event arrives
            loadingFallbackTimeoutId = null;
          }
          setIsLoading(false);
        }
      }
    );

    // Fallback mechanism: if after a short period, onAuthStateChange hasn't fired
    // an event that sets isLoading to false (e.g. INITIAL_SESSION),
    // then we assume loading is complete (e.g., there's truly no session, or some other issue).
    loadingFallbackTimeoutId = setTimeout(() => {
      if (isMounted && isLoading) { // Check if still loading
        console.warn("AuthSessionProvider: isLoading fallback timeout. Forcing isLoading to false.");
        setIsLoading(false);
      }
    }, 2000); // 2-second timeout, adjust if needed

    return () => {
      isMounted = false;
      authListener?.unsubscribe();
      if (loadingFallbackTimeoutId) {
        clearTimeout(loadingFallbackTimeoutId);
      }
    };
  }, [supabaseClient, isLoading]); // isLoading is included to re-evaluate timeout logic if it changes externally,
                                // though primary control is internal to this useEffect.

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
