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
  isLoading: boolean; // Reflects if the initial auth state has been determined
  error: Error | null;
}

const AuthSessionContext = createContext<AuthSessionContextType | undefined>(
  undefined,
);

const getTimestamp = () => new Date().toISOString();

export const AuthSessionProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start loading
  const [error, setError] = useState<Error | null>(null);
  // supabaseClient is stable due to useState initializer
  const [supabaseClient] = useState(() => createClient()); 

  useEffect(() => {
    let isMounted = true;
    console.log(`[${getTimestamp()}] AuthSessionProvider: useEffect mounting. Setting up onAuthStateChange.`);

    const { data: { subscription: authSubscription }, error: subscriptionError } = supabaseClient.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;

        console.log(`[${getTimestamp()}] AuthSessionProvider: onAuthStateChange event:`, event, "Session user:", session?.user);
        setUser(session?.user ?? null);
        
        // Clear previous errors if a new valid session comes through or user signs out
        if (event === 'SIGNED_IN' || (event === 'INITIAL_SESSION' && session) || event === 'SIGNED_OUT') {
            setError(null);
        }

        // INITIAL_SESSION is the key event for knowing the initial state is resolved.
        // SIGNED_IN and SIGNED_OUT also mean the auth state is definitive.
        // This is where we should confidently set isLoading to false.
        if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          if (isLoading && isMounted) { 
            console.log(`[${getTimestamp()}] AuthSessionProvider: Setting isLoading to false due to auth event:`, event);
            setIsLoading(false);
          }
        }
      }
    );

    if (subscriptionError) {
        console.error(`[${getTimestamp()}] AuthSessionProvider: Error subscribing to onAuthStateChange:`, subscriptionError);
        if (isMounted) {
            setError(subscriptionError);
            if (isLoading) setIsLoading(false); // If subscription itself fails, don't hang in loading state
        }
    }

    // Fallback: If no INITIAL_SESSION, SIGNED_IN, or SIGNED_OUT event is received after some time
    // (e.g., user is not logged in at all and there's no session to initialize from storage),
    // ensure isLoading becomes false.
    const loadingFallbackTimeoutId = setTimeout(() => {
      if (isMounted && isLoading) { // Check isLoading again here
        console.warn(`[${getTimestamp()}] AuthSessionProvider: isLoading fallback timeout. Forcing isLoading to false as no definitive auth event received.`);
        setIsLoading(false);
      }
    }, 3000); // 3 seconds timeout, adjust if needed

    return () => {
      isMounted = false;
      authSubscription?.unsubscribe();
      if (loadingFallbackTimeoutId) {
        clearTimeout(loadingFallbackTimeoutId);
      }
      console.log(`[${getTimestamp()}] AuthSessionProvider: useEffect cleanup.`);
    };
  }, [supabaseClient, isLoading]); // isLoading is in dep array to correctly manage the fallback timeout

  return (
    <AuthSessionContext.Provider value={{ user, isLoading, error }}>
      {children}
    </AuthSessionContext.Provider>
  );
};

export const useAuthSession = (): AuthSessionContextType => {
  const context = useContext(AuthSessionContext);
  if (context === undefined) {
    throw new Error('useAuthSession must be used within an AuthSessionProvider');
  }
  return context;
};
