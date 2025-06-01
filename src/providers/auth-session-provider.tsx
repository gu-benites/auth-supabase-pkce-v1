
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
    console.log(`[${getTimestamp()}] AuthSessionProvider (Client): useEffect mounting. Setting up onAuthStateChange.`);

    const { data: { subscription: authSubscription }, error: subscriptionErrorHook } = supabaseClient.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) {
          console.log(`[${getTimestamp()}] AuthSessionProvider (Client): onAuthStateChange received but component unmounted. Event: ${event}`);
          return;
        }

        console.log(`[${getTimestamp()}] AuthSessionProvider (Client): onAuthStateChange event: ${event}. Session user ID: ${session?.user?.id}. Current isLoading: ${isLoading}`);
        setUser(session?.user ?? null);
        
        if (event === 'SIGNED_IN' || (event === 'INITIAL_SESSION' && session) || event === 'SIGNED_OUT') {
            setError(null);
        }

        if (event === 'INITIAL_SESSION' && session?.user && (session as any).error) { // Supabase type for session doesn't include error directly, but it can appear
          console.warn(`[${getTimestamp()}] AuthSessionProvider (Client): INITIAL_SESSION event included an error object for user ${session.user.id}. Error: ${(session as any).error?.message}`);
          Sentry.captureMessage('INITIAL_SESSION event included an error', {
            level: 'warning',
            extra: { 
              userId: session.user.id, 
              sessionErrorName: (session as any).error?.name,
              sessionErrorMessage: (session as any).error?.message 
            },
          });
        }
        
        // Crucially, set isLoading to false *only if it's currently true* and a definitive event occurs
        if (isLoading && (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'SIGNED_OUT')) {
          console.log(`[${getTimestamp()}] AuthSessionProvider (Client): Setting isLoading to false due to auth event: ${event}.`);
          setIsLoading(false);
        }
      }
    );

    if (subscriptionErrorHook) {
        console.error(`[${getTimestamp()}] AuthSessionProvider (Client): Error subscribing to onAuthStateChange:`, subscriptionErrorHook);
        if (isMounted) {
            Sentry.captureMessage('Supabase onAuthStateChange subscription failed', {
              level: 'error',
              extra: { 
                errorName: subscriptionErrorHook.name, 
                errorMessage: subscriptionErrorHook.message 
              },
            });
            setError(subscriptionErrorHook);
            if (isLoading) {
              console.log(`[${getTimestampLog()}] AuthSessionProvider (Client): Setting isLoading to false due to subscription error.`);
              setIsLoading(false); 
            }
        }
    }

    // Fallback timeout to ensure isLoading eventually becomes false
    const loadingFallbackTimeoutId = setTimeout(() => {
      if (isMounted && isLoading) { 
        console.warn(`[${getTimestamp()}] AuthSessionProvider (Client): isLoading fallback timeout. Forcing isLoading to false as no definitive auth event received in 3s.`);
        setIsLoading(false);
      }
    }, 3000); 

    return () => {
      isMounted = false;
      authSubscription?.unsubscribe();
      if (loadingFallbackTimeoutId) {
        clearTimeout(loadingFallbackTimeoutId);
      }
      console.log(`[${getTimestamp()}] AuthSessionProvider (Client): useEffect cleanup. Unsubscribed from onAuthStateChange.`);
    };
  }, [supabaseClient, isLoading]); // isLoading dependency is important here

  console.log(`[${getTimestamp()}] AuthSessionProvider (Client): Rendering. isLoading: ${isLoading}, user ID: ${user?.id}`);
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
  // console.log(`[${getTimestamp()}] useAuthSession (Client): Context consumed. isLoading: ${context.isLoading}, user ID: ${context.user?.id}`);
  return context;
};
