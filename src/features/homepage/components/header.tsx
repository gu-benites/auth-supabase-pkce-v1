// src/features/homepage/components/header.tsx
'use client';

import Link from 'next/link';
import { PassForgeLogo } from '@/components/icons';
import { Button, Skeleton } from '@/components/ui';
import { signOutUserAction } from '@/features/auth/actions';
import { useAuth } from '@/stores/auth.store'; // Import the useAuth hook

/**
 * Renders the header for the homepage.
 * Displays PassForge logo, application name, and navigation links.
 * Navigation links change based on the user's authentication status (loading, authenticated, unauthenticated).
 *
 * @returns {JSX.Element} The homepage header component.
 */
export function HomepageHeader(): JSX.Element {
  const { user, profile, isAuthenticated, isLoading, userMetadata } = useAuth();

  // Determine display name: profile.username > userMetadata.first_name > user.email prefix
  const getDisplayName = () => {
    if (profile?.username) return profile.username;
    if (userMetadata?.first_name) return userMetadata.first_name;
    if (user?.email) return user.email.split('@')[0];
    return 'User';
  };

  const displayName = getDisplayName();

  return (
    <header className="py-4 px-6 md:px-8 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <PassForgeLogo className="h-8 w-8 text-primary group-hover:text-accent transition-colors" />
          <span className="text-xl font-semibold text-foreground group-hover:text-accent transition-colors">
            PassForge
          </span>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-4">
          {isLoading ? (
            <>
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-20 rounded-md" />
              <Skeleton className="h-8 w-20 rounded-md" />
            </>
          ) : isAuthenticated && user ? (
            <>
              <span className="text-sm text-foreground hidden sm:inline">
                Hi, {displayName}
              </span>
              <form action={signOutUserAction} className="inline-flex">
                <Button variant="ghost" type="submit">Sign Out</Button>
              </form>
              <Button variant="secondary" asChild>
                <Link href="/profile">Profile</Link>
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/forgot-password">Request Reset</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button variant="default" asChild>
                <Link href="/register">Sign Up</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
