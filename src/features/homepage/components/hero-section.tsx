// src/features/homepage/components/hero-section.tsx
'use client';

import Link from 'next/link';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks';

export function HeroSection() {
  const { user, profile, isAuthenticated, isLoading, error } = useAuth();

  if (isLoading) {
    return (
      <section className="py-16 md:py-24 bg-gradient-to-b from-background to-muted/50">
        <div className="container mx-auto px-6 md:px-8 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground mt-4">Loading user information...</p>
        </div>
      </section>
    );
  }

  if (isAuthenticated && user) {
    return (
      <section className="py-16 md:py-24 bg-gradient-to-b from-background to-muted/50">
        <div className="container mx-auto px-6 md:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
            Welcome Back!
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Here's some debugging information for your session.
          </p>
          <Card className="max-w-3xl mx-auto text-left shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl">Authenticated User Debug Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg text-primary">Auth Status:</h3>
                <p className="text-sm text-foreground">Is Authenticated: {isAuthenticated ? 'Yes' : 'No'}</p>
              </div>
              
              {error && (
                <div>
                  <h3 className="font-semibold text-lg text-destructive">Auth Hook Error:</h3>
                  <pre className="bg-muted p-3 rounded-md text-destructive-foreground text-xs overflow-auto">
                    {JSON.stringify(error, null, 2)}
                  </pre>
                </div>
              )}

              <div>
                <h3 className="font-semibold text-lg text-primary">User Object (from Supabase Auth):</h3>
                <pre className="bg-muted p-3 rounded-md text-muted-foreground text-xs overflow-auto max-h-96">
                  {JSON.stringify(user, null, 2)}
                </pre>
              </div>

              <div>
                <h3 className="font-semibold text-lg text-primary">Profile Object (from UserProfileQuery):</h3>
                {profile ? (
                  <pre className="bg-muted p-3 rounded-md text-muted-foreground text-xs overflow-auto max-h-96">
                    {JSON.stringify(profile, null, 2)}
                  </pre>
                ) : (
                  <p className="text-sm text-muted-foreground">No detailed profile data loaded or available.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  // Default content for unauthenticated users
  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-background to-muted/50">
      <div className="container mx-auto px-6 md:px-8 text-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
          Secure & Simple <span className="text-primary">Password Resets</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          PassForge provides a seamless and secure experience for managing your password recovery process.
          Get back into your account quickly and safely.
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-12">
          <Button size="lg" asChild>
            <Link href="/auth/forgot-password">
              Reset Your Password
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/auth/login">
              Access Your Account
            </Link>
          </Button>
        </div>
        {/* Placeholder image removed, debug info will show for authenticated users */}
      </div>
    </section>
  );
}
