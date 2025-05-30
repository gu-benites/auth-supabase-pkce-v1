// src/features/homepage/components/header.tsx
'use client';

import Link from 'next/link';
import { PassForgeLogo } from '@/components/icons';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui';
import { signOutUserAction } from '@/features/auth/actions';
import { useAuth } from '@/features/auth/hooks'; 
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserCircle2 } from 'lucide-react';


/**
 * Renders the header for the homepage.
 * Displays PassForge logo, application name, and navigation links.
 * Navigation links change based on the user's authentication status (loading, authenticated, unauthenticated),
 * using the `useAuth` hook which combines session and profile state.
 *
 * @returns {JSX.Element} The homepage header component.
 */
export function HomepageHeader(): JSX.Element {
  const { user, profile, isAuthenticated, isLoading } = useAuth();

  const getDisplayName = () => {
    if (profile?.firstName) return profile.firstName;
    // @ts-ignore - user_metadata is a dynamic object
    if (user?.user_metadata?.first_name) return user.user_metadata.first_name;
    if (user?.email) return user.email.split('@')[0];
    return 'User';
  };

  const getInitials = () => {
    const firstName = profile?.firstName || user?.user_metadata?.first_name;
    // @ts-ignore - user_metadata is a dynamic object
    const lastName = profile?.lastName || user?.user_metadata?.last_name;
    const firstInitial = firstName?.[0] || '';
    const lastInitial = lastName?.[0] || '';
    const initials = `${firstInitial}${lastInitial}`.toUpperCase();
    return initials || <UserCircle2 size={18} />; // Return icon if no initials
  };
  
  const avatarUrl = profile?.avatarUrl || user?.user_metadata?.avatar_url;


  return (
    <header className="py-4 px-6 md:px-8 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <PassForgeLogo className="h-8 w-8 text-primary group-hover:text-accent transition-colors" />
          {/* Changed text-primary to text-foreground and group-hover:text-accent to group-hover:text-primary for more standard text behavior */}
          <span className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
            PassForge
          </span>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-4">
          {isLoading ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          ) : isAuthenticated && user ? (
            <>
              <span className="text-sm text-foreground hidden sm:inline">
                Hi, {getDisplayName()}
              </span>
              <Avatar className="h-8 w-8 text-sm">
                <AvatarImage src={avatarUrl} alt={getDisplayName()} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <form action={signOutUserAction} className="inline-flex">
                <Button variant="ghost" type="submit" size="sm">Sign Out</Button>
              </form>
              <Button variant="secondary" asChild size="sm">
                <Link href="/profile">Profile</Link> 
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild size="sm">
                <Link href="/auth/forgot-password">Request Reset</Link>
              </Button>
              <Button variant="ghost" asChild size="sm">
                <Link href="/auth/login">Login</Link>
              </Button>
              <Button variant="default" asChild size="sm">
                <Link href="/auth/register">Sign Up</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
