// src/providers/auth-session-provider.tsx
'use client';

import { type User } from '@supabase/supabase-js';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  type ReactNode,
} from 'react';
import { createClient } from '@/lib/supabase/client';
import * as Sentry from '@sentry/nextjs';

interface AuthSessionContextType {
  user: User | null;
  isLoading: boolean; // True until a definitive session state is known or timeout
  error: Error | null;
}

const AuthSessionContext = createContext<AuthSessionContextType | undefined>(
  undefined,
);

const getTimestampLog = () => new Date().toISOString(); 

export const AuthSessionProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); 
  const [error, setError] = useState<Error | null>(null);
  const [supabaseClient] = useState(() => createClient());

  const isMountedRef = useRef(true);
  const initialSessionProcessedRef = useRef(false); // Tracks if INITIAL_SESSION event logic has run

  useEffect(() => {
    isMountedRef.current = true;
    initialSessionProcessedRef.current = false; 
    
    // This log helps see the state when the effect that sets up subscription runs.
    // On initial mount, isLoading is true from useState.
    console.log(`[${getTimestampLog()}] AuthSessionProvider (Client): Subscribing to onAuthStateChange. Initial isLoading: ${isLoading}, User: ${user?.id}`);

    const { data: { subscription: authSubscription }, error: subscriptionErrorHook } = supabaseClient.auth.onAuthStateChange(
      (event, session) => {
        if (!isMountedRef.current) {
          console.log(`[${getTimestampLog()}] AuthSessionProvider (Client): onAuthStateChange received but component unmounted. Event: ${event}`);
          return;
        }

        // Use the `isLoading` state variable directly from the closure of this callback.
        console.log(`[${getTimestampLog()}] AuthSessionProvider (Client): onAuthStateChange event: ${event}. Session user ID: ${session?.user?.id}. Current isLoading state variable: ${isLoading}, initialSessionProcessedRef: ${initialSessionProcessedRef.current}`);
        
        setUser(session?.user ?? null);
        
        const sessionWithError = session as (typeof session & { error?: any });
        if (sessionWithError?.user && sessionWithError?.error) {
          const detailedError = sessionWithError.error;
          console.warn(`[${getTimestampLog()}] AuthSessionProvider (Client): Auth event '${event}' included an error object for user ${sessionWithError.user.id}. Error: ${detailedError?.message}`);
          setError(new Error(detailedError?.message || 'Unknown session error'));
          Sentry.captureMessage(`Auth event '${event}' included an error`, {
            level: 'warning',
            extra: { userId: sessionWithError.user.id, sessionErrorName: detailedError?.name, sessionErrorMessage: detailedError?.message },
          });
        } else if (event !== 'USER_UPDATED' && event !== 'PASSWORD_RECOVERY' && event !== 'MFA_CHALLENGE_VERIFIED') {
          setError(null);
        }
        
        if (event === 'INITIAL_SESSION') {
          if (!initialSessionProcessedRef.current) { // Ensure this block runs only once per subscription lifecycle
            if (session?.user) {
              console.log(`[${getTimestampLog()}] AuthSessionProvider (Client): INITIAL_SESSION received with user. Setting isLoading to false.`);
              setIsLoading(false);
            } else {
              console.log(`[${getTimestampLog()}] AuthSessionProvider (Client): INITIAL_SESSION received with NO user. isLoading remains true, awaiting timeout or subsequent event like SIGNED_IN.`);
              // isLoading remains true, will be set to false by a subsequent event or the timeout.
            }
            initialSessionProcessedRef.current = true; 
          }
        } else if (isLoading) { // If a non-INITIAL_SESSION event occurs AND we are still in the initial loading phase
          if (session?.user || event === 'SIGNED_OUT') { // Any event that definitively resolves session state
            console.log(`[${getTimestampLog()}] AuthSessionProvider (Client): Event ${event} received while still initial loading. Setting isLoading to false.`);
            setIsLoading(false);
            if (!initialSessionProcessedRef.current) initialSessionProcessedRef.current = true; // Should be true if INITIAL_SESSION already fired
          }
        }
      }
    );

    if (subscriptionErrorHook) {
        console.error(`[${getTimestampLog()}] AuthSessionProvider (Client): Error subscribing to onAuthStateChange:`, subscriptionErrorHook);
        if (isMountedRef.current) { // Check mounted before setting state
            Sentry.captureMessage('Supabase onAuthStateChange subscription failed', {
              level: 'error',
              extra: { errorName: subscriptionErrorHook.name, errorMessage: subscriptionErrorHook.message },
            });
            setError(subscriptionErrorHook);
            if (isLoading) setIsLoading(false); // If subscription fails, stop loading
            initialSessionProcessedRef.current = true; // Mark initial processing as done/failed
        }
    }

    const loadingFallbackTimeoutId = setTimeout(() => {
      if (isMountedRef.current && isLoading) { 
        console.warn(`[${getTimestampLog()}] AuthSessionProvider (Client): isLoading fallback timeout (3s). Forcing isLoading to false as initial session state not definitively resolved by an event with a user.`);
        setIsLoading(false);
        initialSessionProcessedRef.current = true; 
      }
    }, 3000); 

    return () => {
      isMountedRef.current = false; 
      authSubscription?.unsubscribe();
      clearTimeout(loadingFallbackTimeoutId);
      console.log(`[${getTimestampLog()}] AuthSessionProvider (Client): useEffect cleanup. Unsubscribed from onAuthStateChange.`);
    };
  }, [supabaseClient]); // Effect only depends on the stable supabaseClient

  useEffect(() => {
    console.log(`[${getTimestampLog()}] AuthSessionProvider (Client): State update render. isLoading: ${isLoading}, user ID: ${user?.id}`);
  }, [isLoading, user]);

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
