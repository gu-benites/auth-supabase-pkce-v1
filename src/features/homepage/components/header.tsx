// src/features/homepage/components/header.tsx
import Link from 'next/link';
import { PassForgeLogo } from '@/components/icons';
import { Button } from '@/components/ui';
import { signOutUserAction } from '@/features/auth/actions'; // Import the new action

export function HomepageHeader() {
  // TODO: Implement useAuth hook from Zustand (see docs/integrating-state-and-data-fetching.md)
  // to conditionally render Login/Sign Up vs. Sign Out/Profile buttons.
  // For now, all buttons are visible.
  // const { isAuthenticated, user } = useAuth(); // Example of future state

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
          {/* Example of conditional rendering (needs useAuth to be implemented)
          {isAuthenticated ? (
            <>
              <span>Hi, {user?.email}</span> {}
              <form action={signOutUserAction}>
                <Button variant="ghost" type="submit">Sign Out</Button>
              </form>
              <Button variant="default" asChild>
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
          */}

          {/* For now, showing all links for demonstration until useAuth is implemented */}
          <Button variant="ghost" asChild>
            <Link href="/forgot-password">Request Reset</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/login">Login</Link>
          </Button>
          <Button variant="default" asChild>
            <Link href="/register">Sign Up</Link>
          </Button>
           <form action={signOutUserAction} className="inline-flex">
            <Button variant="outline" type="submit">Sign Out</Button>
          </form>
          <Button variant="secondary" asChild>
            <Link href="/profile">Profile</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
