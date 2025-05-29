
import { HomepageHeader } from '@/features/homepage/components';
import { HeroSection } from '@/features/homepage/components';

export function HomepageLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <HomepageHeader />
      <main className="flex-grow">
        <HeroSection />
        <section className="py-12 md:py-20">
            <div className="container mx-auto px-6 md:px-8 text-center">
                <h2 className="text-3xl font-semibold text-foreground mb-4">Why PassForge?</h2>
                <p className="text-muted-foreground max-w-xl mx-auto">
                    We focus on a streamlined, developer-friendly password reset flow using modern technologies like Next.js and Supabase, wrapped in a clean UI.
                </p>
            </div>
        </section>
      </main>
      <footer className="py-8 text-center text-sm text-muted-foreground border-t">
        &copy; {new Date().getFullYear()} PassForge. All rights reserved. An example application.
      </footer>
    </div>
  );
}
