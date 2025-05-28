"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PassForgeLogo } from '@/components/icons/passforge-logo';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AuthConfirmPage() {
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();
  const [status, setStatus] = useState<{ type: 'loading' | 'success' | 'error', message: string }>({
    type: 'loading',
    message: 'Verifying your password reset request...',
  });

  const effectRan = useRef(false);

  useEffect(() => {
    if (effectRan.current) return;
    effectRan.current = true;

    // Check for explicit errors passed in query params by Supabase redirect
    const params = new URLSearchParams(window.location.search);
    const errorParam = params.get('error');
    const errorDescriptionParam = params.get('error_description');

    if (errorParam || errorDescriptionParam) {
      setStatus({
        type: 'error',
        message: errorDescriptionParam || errorParam || 'An unknown error occurred.',
      });
      toast({
        title: "Verification Failed",
        description: errorDescriptionParam || errorParam || 'An unknown error occurred.',
        variant: "destructive",
      });
      return;
    }
    
    // Supabase client library automatically handles the recovery token from the URL hash.
    // Listen for auth state changes.
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) {
        // This event fires when the recovery token has been processed and a session is started.
        setStatus({ type: 'success', message: 'Verification successful! Redirecting...' });
        toast({
          title: "Verified!",
          description: "You can now update your password.",
        });
        router.push('/update-password');
      } else if (event === 'SIGNED_IN' && session && window.location.hash.includes('type=recovery')) {
        // Fallback: if user is signed in and type=recovery is in hash, likely password recovery path
        setStatus({ type: 'success', message: 'Session detected. Redirecting to update password...' });
        router.push('/update-password');
      }
    });

    // Handle cases where the PASSWORD_RECOVERY event might not fire or is missed
    // (e.g., if the page reloads or the listener attaches late)
    // We check if there's a recovery fragment in the URL.
    // The Supabase client should handle this on initialization.
    // If, after a delay, we're still 'loading', check session.
    const fallbackTimer = setTimeout(() => {
      if (status.type === 'loading') {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session && window.location.hash.includes('type=recovery')) {
             setStatus({ type: 'success', message: 'Session active. Redirecting to update password...' });
             router.push('/update-password');
          } else if (!session && window.location.hash.includes('type=recovery')) {
            // Token might be invalid or expired, but not throwing an error via query param
            setStatus({ type: 'error', message: 'Invalid or expired recovery link. Please request a new one.' });
            toast({
              title: "Verification Failed",
              description: "Invalid or expired recovery link.",
              variant: "destructive",
            });
          } else if (!session) {
             setStatus({ type: 'error', message: 'No active session found. Please initiate password reset again.' });
          }
        });
      }
    }, 3000); // 3 seconds timeout for fallback

    return () => {
      authListener?.unsubscribe();
      clearTimeout(fallbackTimer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, supabase]); // Dependencies intentionally limited for single run logic.

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4 animate-fade-in">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <PassForgeLogo className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold">PassForge</CardTitle>
          <CardDescription>Password Reset Confirmation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          {status.type === 'loading' && <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />}
          {status.type === 'error' && <AlertTriangle className="mx-auto h-8 w-8 text-destructive" />}
          <p className={`text-sm ${status.type === 'error' ? 'text-destructive' : 'text-foreground'}`}>
            {status.message}
          </p>
          {status.type === 'error' && (
            <Button onClick={() => router.push('/')} className="w-full">
              Request New Reset Link
            </Button>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
