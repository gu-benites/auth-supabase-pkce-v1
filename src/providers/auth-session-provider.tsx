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
 * The `isLoading` state specifically tracks the completion of the initial session fetch.
 *
 * @param {object} props - The component's props.
 * @param {ReactNode} props.children - The child components to render.
 * @returns {JSX.Element} The provider component.
 */
export const AuthSessionProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // True until initial session is fetched
  const [error, setError] = useState<Error | null>(null);
  // Instantiate client stably using useState's initializer function
  const [supabaseClient] = useState(() => createClient());

  useEffect(() => {
    let isMounted = true; // Track if component is still mounted

    const initializeSession = async () => {
      try {
        // Fetch the initial user session
        const { data: { user: initialUser }, error: initialError } = await supabaseClient.auth.getUser();
        
        if (!isMounted) return; // Don't update state if component unmounted

        if (initialError) {
          console.error("Error fetching initial user session:", initialError);
          setError(initialError);
        }
        setUser(initialUser ?? null);
      } catch (e) {
        if (!isMounted) return;
        console.error("Exception during initial user session fetch:", e);
        setError(e instanceof Error ? e : new Error('Unknown error during session fetch'));
      } finally {
        if (isMounted) {
          setIsLoading(false); // Initial session check complete
        }
      }
    };

    initializeSession();

    // Set up the auth state change listener
    const { data: authListener } = supabaseClient.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;
        
        setUser(session?.user ?? null);
        setError(null); // Clear previous errors on new auth state

        // While this listener handles ongoing changes,
        // the primary `isLoading` flag of this provider is for the *initial* load.
        // If a SIGNED_OUT event occurs, user becomes null, and isLoading is already false.
        // If a SIGNED_IN event occurs, user is set, and isLoading is already false.
      }
    );

    return () => {
      isMounted = false;
      authListener?.unsubscribe();
    };
  }, [supabaseClient]); // supabaseClient is stable due to useState initialization

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
