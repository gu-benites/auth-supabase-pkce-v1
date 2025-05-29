
import { HomepageHeader } from '@/features/homepage/components';
import { HeroSection } from '@/features/homepage/components';
// TODO: This import should eventually point to the new useAuth hook from @/features/auth/hooks/
// once Tasks 1.1 through 1.5 of implementation-consultant.md are complete.
// For now, it uses the existing Zustand-based hook.
import { useAuth } from '@/features/auth/hooks/';

/**
 * Defines the main layout structure for the homepage.
 * It includes a header, a main content area (which can conditionally display
 * a hero section or a logged-in message), and a footer.
 *
 * This component relies on the `useAuth` hook to determine the user's
 * authentication status and conditionally render content.
 *
 * @returns {JSX.Element} The homepage layout component.
 */
export function HomepageLayout(): JSX.Element {
  // TODO: This useAuth hook and its destructuring will change once the
  // new useAuth hook (from @/features/auth/hooks) is implemented.
  const { isAuthenticated, isLoading } = useAuth(); // Use the hook

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <HomepageHeader />
      <main className="flex-grow">
        {/* Conditionally render content based on auth status */}
        {!isLoading && !isAuthenticated && <HeroSection />}
        {!isLoading && isAuthenticated && (
          <div className="container mx-auto px-6 md:px-8 text-center py-12 md:py-20">
            <h2 className="text-3xl font-semibold text-foreground">You are logged in!</h2>
          </div>
        )}
        <section className="py-12 md:py-20">
            <div className="container mx-auto px-6 md:px-8 text-center"> {/* Added missing container div for centering */}
                <h2 className="text-3xl font-semibold text-foreground mb-4">Why PassForge?</h2>
                <p className="text-muted-foreground max-w-xl mx-auto">
                    We focus on a streamlined, developer-friendly password reset flow using modern technologies like Next.js and Supabase, wrapped in a clean UI.
                </p>
            </div> {/* This closing div was missing */}
        </section>
      </main>
      <footer className="py-8 text-center text-sm text-muted-foreground border-t">
        &copy; {new Date().getFullYear()} PassForge. All rights reserved. An example application.
      </footer>
    </div>
  );
}
