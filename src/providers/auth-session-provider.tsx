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
  isLoading: boolean;
  error: Error | null;
}

const AuthSessionContext = createContext<AuthSessionContextType | undefined>(
  undefined,
);

/**
 * Provides the Supabase user session to its children components via React Context.
 * It listens to Supabase's onAuthStateChange to keep the session state updated.
 *
 * @param {object} props - The component's props.
 * @param {ReactNode} props.children - The child components to render.
 * @returns {JSX.Element} The provider component.
 */
export const AuthSessionProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabaseClient = createClient(); 

  useEffect(() => {
    setIsLoading(true); // Set loading true at the start of effect
    const fetchUserAndListen = async () => {
      try {
        const { data: { user: initialUser }, error: initialError } = await supabaseClient.auth.getUser();
        if (initialError) {
          console.error("Error fetching initial user session:", initialError);
          setError(initialError);
        }
        setUser(initialUser ?? null);
      } catch (e) {
        console.error("Catch block error fetching initial user session:", e);
        setError(e as Error);
      } finally {
        // Only set isLoading to false after initial check is complete
        // The listener below will handle subsequent loading states for auth changes
      }

      const { data: authListener } = supabaseClient.auth.onAuthStateChange(
        async (event, session) => {
          setIsLoading(true); // Set loading true when auth state change starts
          try {
            setUser(session?.user ?? null);
            setError(null); 
          } catch (e) {
            setError(e as Error);
            console.error("Error in onAuthStateChange listener:", e);
          } finally {
            setIsLoading(false); // Set loading false after processing auth state change
          }
        },
      );
      
      // Set initial loading to false after listener is attached and initial user fetched
      setIsLoading(false);

      return () => { 
        authListener?.unsubscribe();
      };
    };

    fetchUserAndListen();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // supabaseClient is stable and doesn't need to be in deps for this pattern

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
 * @returns {AuthSessionContextType} The authentication session context (user, isLoading, error).
 */
export const useAuthSession = () => {
  const context = useContext(AuthSessionContext);
  if (context === undefined) {
    throw new Error('useAuthSession must be used within an AuthSessionProvider');
  }
  return context;
};
