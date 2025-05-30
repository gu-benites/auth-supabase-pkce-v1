// src/features/homepage/hero-section.tsx
'use client';

import React from 'react';
import HeroHeader from './components/hero-header/hero-header';
import HeroCanvasBackground from './components/hero-canvas-background/hero-canvas-background';
import HeroContent from './components/hero-content/hero-content';
import { useAuth } from '@/features/auth/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

/**
 * The main orchestrating component for the homepage.
 * It combines the header, an interactive canvas background, and the primary hero content.
 * Includes a debug section to display authentication state if a user is logged in.
 * The main hero content is rendered immediately, while auth-dependent debug info loads.
 *
 * @returns {JSX.Element} The complete hero section for the homepage.
 */
export const HeroSection: React.FC = () => {
  const { user, profile, isAuthenticated, isLoading, error: authError } = useAuth();

  return (
    <section className="relative bg-background text-muted-foreground min-h-screen flex flex-col overflow-x-hidden pt-[100px]">
      {/* Canvas Background - z-0 */}
      <HeroCanvasBackground color="var(--primary)" />

      {/* Original Gradient Overlay - z-1 */}
      <div
        className="absolute inset-0 z-1 pointer-events-none"
        style={{
          background:
            'linear-gradient(to bottom, transparent 0%, hsl(var(--background)) 90%), radial-gradient(ellipse at center, transparent 40%, hsl(var(--background)) 95%)',
        }}
      />

      {/* Header - z-30 (Managed by HeroHeader itself, fixed position) */}
      <HeroHeader />

      {/* Content Area - z-10 */}
      <main className="flex-grow flex flex-col items-center justify-center text-center px-4 pt-8 pb-16 relative z-10">
        {/* Conditional Debug Information */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center text-foreground mb-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-sm">Loading Auth Info...</p>
          </div>
        ) : isAuthenticated ? (
          <Card className="w-full max-w-2xl mx-auto mb-8 text-left bg-background/80 backdrop-blur-sm shadow-xl">
            <CardHeader>
              <CardTitle className="text-primary">Authenticated User Info (Debug)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <strong className="text-foreground">Is Authenticated:</strong>{' '}
                <span className="text-green-500 font-semibold">true</span>
              </div>
              <div>
                <strong className="text-foreground">User Object (from Session):</strong>
                <pre className="mt-1 p-2 bg-muted rounded-md overflow-x-auto text-xs">
                  {JSON.stringify(user, null, 2)}
                </pre>
              </div>
              <div>
                <strong className="text-foreground">Profile Object (from TanStack Query):</strong>
                {profile ? (
                  <pre className="mt-1 p-2 bg-muted rounded-md overflow-x-auto text-xs">
                    {JSON.stringify(profile, null, 2)}
                  </pre>
                ) : (
                  <p className="text-muted-foreground">Profile not loaded or not available.</p>
                )}
              </div>
              {authError && (
                <div>
                  <strong className="text-destructive">Auth Error:</strong>
                  <pre className="mt-1 p-2 bg-destructive/10 text-destructive rounded-md overflow-x-auto text-xs">
                    {JSON.stringify(authError, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        ) : null} {/* End of conditional debug information */}

        {/* HeroContent - Renders immediately and unconditionally */}
        <HeroContent />
      </main>
    </section>
  );
};
