// src/features/homepage/components/header.tsx
'use client';

import Link from 'next/link';
import { PassForgeLogo } from '@/components/icons';
import { Loader2 } from 'lucide-react';
import { Button, Skeleton } from '@/components/ui';
import { signOutUserAction } from '@/features/auth/actions';
import { useAuth } from '@/features/auth/hooks'; // Updated import to the new useAuth hook

/**
 * Renders the header for the homepage.
 * Displays PassForge logo, application name, and navigation links.
 * Navigation links change based on the user's authentication status (loading, authenticated, unauthenticated),
 * now using the refactored useAuth hook.
 *
 * @returns {JSX.Element} The homepage header component.
 */
export function HomepageHeader(): JSX.Element {
  // Use the new useAuth hook from @/features/auth/hooks
  // This hook combines session data from AuthSessionContext and profile data from TanStack Query.
  const { user, profile, isAuthenticated, isLoading } = useAuth();

  // Determine display name: profile.firstName (from detailed profile)
  // -> user.user_metadata.first_name (fallback from raw user)
  // -> user.email prefix (another fallback)
  const getDisplayName = () => {
    if (profile?.firstName) return profile.firstName;
    // Assuming user_metadata might store first_name (adjust if your metadata structure is different)
    // @ts-ignore
    if (user?.user_metadata?.first_name) return user.user_metadata.first_name;
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
            // Show a spinner while loading session or profile
            <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
          ) : isAuthenticated && user ? ( // Check for user object as well
            <>
              <span className="text-sm text-foreground hidden sm:inline">
                Hi, {displayName}
              </span>
              {/* Placeholder for profile avatar if available from the detailed profile */}
              {/* {profile?.avatarUrl && (
                <img src={profile.avatarUrl} alt="User avatar" className="h-8 w-8 rounded-full" />
              )} */}
              <form action={signOutUserAction} className="inline-flex">
                <Button variant="ghost" type="submit">Sign Out</Button>
              </form>
              <Button variant="secondary" asChild>
                {/* TODO: Link to a user profile page once created, e.g., /profile or /dashboard */}
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
