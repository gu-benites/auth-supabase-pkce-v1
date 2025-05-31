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
import * as Sentry from '@sentry/nextjs';

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

    const { data: { subscription: authSubscription }, error: subscriptionErrorHook } = supabaseClient.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;

        console.log(`[${getTimestamp()}] AuthSessionProvider: onAuthStateChange event:`, event, "Session user:", session?.user?.id);
        setUser(session?.user ?? null);
        
        // Clear previous errors if a new valid session comes through or user signs out
        if (event === 'SIGNED_IN' || (event === 'INITIAL_SESSION' && session) || event === 'SIGNED_OUT') {
            setError(null);
        }

        // Log if INITIAL_SESSION comes with an error
        if (event === 'INITIAL_SESSION' && session?.user && (session as any).error) { // Supabase type for session doesn't include error directly, but it can appear
          Sentry.captureMessage('INITIAL_SESSION event included an error', {
            level: 'warning',
            extra: { 
              userId: session.user.id, 
              sessionErrorName: (session as any).error?.name,
              sessionErrorMessage: (session as any).error?.message 
            },
          });
        }
        
        if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          if (isLoading && isMounted) { 
            console.log(`[${getTimestamp()}] AuthSessionProvider: Setting isLoading to false due to auth event:`, event);
            setIsLoading(false);
          }
        }
      }
    );

    if (subscriptionErrorHook) {
        console.error(`[${getTimestamp()}] AuthSessionProvider: Error subscribing to onAuthStateChange:`, subscriptionErrorHook);
        if (isMounted) {
            Sentry.captureMessage('Supabase onAuthStateChange subscription failed', {
              level: 'error',
              extra: { 
                errorName: subscriptionErrorHook.name, 
                errorMessage: subscriptionErrorHook.message 
              },
            });
            setError(subscriptionErrorHook);
            if (isLoading) setIsLoading(false); 
        }
    }

    const loadingFallbackTimeoutId = setTimeout(() => {
      if (isMounted && isLoading) { 
        console.warn(`[${getTimestamp()}] AuthSessionProvider: isLoading fallback timeout. Forcing isLoading to false as no definitive auth event received.`);
        setIsLoading(false);
      }
    }, 3000); 

    return () => {
      isMounted = false;
      authSubscription?.unsubscribe();
      if (loadingFallbackTimeoutId) {
        clearTimeout(loadingFallbackTimeoutId);
      }
      console.log(`[${getTimestamp()}] AuthSessionProvider: useEffect cleanup.`);
    };
  }, [supabaseClient, isLoading]); 

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
