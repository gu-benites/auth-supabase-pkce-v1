// src/providers/auth-session-provider.tsx
'use client';

import { type User } from '@supabase/supabase-js';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef, // Added useRef
  type ReactNode,
} from 'react';
import { createClient } from '@/lib/supabase/client';
import * as Sentry from '@sentry/nextjs';

interface AuthSessionContextType {
  user: User | null;
  isLoading: boolean; // True until INITIAL_SESSION event (or timeout)
  error: Error | null;
}

const AuthSessionContext = createContext<AuthSessionContextType | undefined>(
  undefined,
);

// Assuming getTimestampLog is available or defined elsewhere in your actual file.
// If not, define it here for logging:
const getTimestampLog = () => new Date().toISOString(); 

export const AuthSessionProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // True until INITIAL_SESSION is processed
  const [error, setError] = useState<Error | null>(null);
  const [supabaseClient] = useState(() => createClient());

  // Ref to track mounted state to avoid state updates on unmounted component
  const isMountedRef = useRef(true);
  // Ref to track if initial session event (or timeout) has processed and set isLoading to false
  const initialSessionProcessedRef = useRef(false);

  useEffect(() => {
    // This effect runs once on mount to set up the listener
    // and then on unmount to clean up.
    isMountedRef.current = true;
    initialSessionProcessedRef.current = false; // Reset for potential fast refresh scenarios
    
    // If isLoading is already false from a previous render (e.g. fast refresh retaining state),
    // but we are re-subscribing, reset it to true to reflect new subscription attempt.
    // However, with stable supabaseClient, this effect should run once.
    // For robustness, explicitly set isLoading to true here if it wasn't already.
    if (!isLoading) { // If isLoading was somehow false, reset it for this new subscription cycle
        // console.log(`[${getTimestampLog()}] AuthSessionProvider (Client): useEffect mounting, ensuring isLoading is true.`);
        // setIsLoading(true); // This line might cause an infinite loop if isLoading is in deps, let's be careful
                            // Better: rely on the initial useState(true) and ensure this effect runs once.
    } else {
        console.log(`[${getTimestampLog()}] AuthSessionProvider (Client): useEffect mounting. Initial isLoading is true.`);
    }


    const { data: { subscription: authSubscription }, error: subscriptionErrorHook } = supabaseClient.auth.onAuthStateChange(
      (event, session) => {
        if (!isMountedRef.current) {
          console.log(`[${getTimestampLog()}] AuthSessionProvider (Client): onAuthStateChange received but component unmounted. Event: ${event}`);
          return;
        }

        console.log(`[${getTimestampLog()}] AuthSessionProvider (Client): onAuthStateChange event: ${event}. Session user ID: ${session?.user?.id}. Current isLoading (ref): ${initialSessionProcessedRef.current}`);
        
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
          // Clear error on major state changes like SIGNED_IN, SIGNED_OUT, INITIAL_SESSION (if no error in session)
          setError(null);
        }
        
        if (event === 'INITIAL_SESSION') {
          if (!initialSessionProcessedRef.current) {
            console.log(`[${getTimestampLog()}] AuthSessionProvider (Client): INITIAL_SESSION received. Setting isLoading to false.`);
            setIsLoading(false);
            initialSessionProcessedRef.current = true;
          }
        }
      }
    );

    if (subscriptionErrorHook) {
        console.error(`[${getTimestampLog()}] AuthSessionProvider (Client): Error subscribing to onAuthStateChange:`, subscriptionErrorHook);
        if (isMountedRef.current && !initialSessionProcessedRef.current) {
            Sentry.captureMessage('Supabase onAuthStateChange subscription failed', {
              level: 'error',
              extra: { errorName: subscriptionErrorHook.name, errorMessage: subscriptionErrorHook.message },
            });
            setError(subscriptionErrorHook);
            setIsLoading(false); 
            initialSessionProcessedRef.current = true;
        }
    }

    // Fallback timeout: if INITIAL_SESSION hasn't processed and set isLoading to false within 3s.
    const loadingFallbackTimeoutId = setTimeout(() => {
      if (isMountedRef.current && !initialSessionProcessedRef.current) { 
        console.warn(`[${getTimestampLog()}] AuthSessionProvider (Client): isLoading fallback timeout (3s). Forcing isLoading to false as INITIAL_SESSION was not processed.`);
        setIsLoading(false);
        initialSessionProcessedRef.current = true;
      }
    }, 3000); 

    return () => {
      isMountedRef.current = false; // Set mounted to false on cleanup
      authSubscription?.unsubscribe();
      clearTimeout(loadingFallbackTimeoutId);
      console.log(`[${getTimestampLog()}] AuthSessionProvider (Client): useEffect cleanup. Unsubscribed from onAuthStateChange.`);
    };
  }, [supabaseClient]); // Effect only depends on supabaseClient (which is stable)

  // The console log for rendering should reflect the current state values
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
  // console.log(`[${getTimestampLog()}] useAuthSession (Client): Context consumed. isLoading: ${context.isLoading}, user ID: ${context.user?.id}`);
  return context;
};
