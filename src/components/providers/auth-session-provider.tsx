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

export const AuthSessionProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabaseClient = createClient(); // Create the supabase client instance here

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabaseClient.auth.getUser(); // Use the client instance
      // @ts-ignore
      setUser(user);
      setIsLoading(false); // Add this line
    };

    fetchUser();

    const { data: authListener } = supabaseClient.auth.onAuthStateChange(
      async (event, session) => {
        try {
          setIsLoading(true);
          setUser(session?.user ?? null);
          setError(null); // Clear error on successful auth change
          setIsLoading(false); // Add this line
        } catch (e) {
          setIsLoading(false); // Ensure loading is false even on error
          setError(e as Error);
        } finally {
          setIsLoading(false);
        }
      },
    );

    return () => { // Clean up the listener
      authListener?.unsubscribe();
    };
  }, []);

  return (
    <AuthSessionContext.Provider value={{ user, isLoading, error }}>
      {children}
    </AuthSessionContext.Provider>
  );
};

// Add the useContext hook for consumers
export const useAuthSession = () => {
  const context = useContext(AuthSessionContext);
  if (context === undefined) {
    throw new Error('useAuthSession must be used within an AuthSessionProvider');
  }
  return context;
};
