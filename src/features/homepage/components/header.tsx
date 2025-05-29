
import Link from 'next/link';
import { PassForgeLogo } from '@/components/icons';
import { Button } from '@/components/ui';

export function HomepageHeader() {
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
          <Button variant="ghost" asChild>
            <Link href="/forgot-password">Request Reset</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/login">Login</Link>
          </Button>
           <Button variant="default" asChild>
            <Link href="/">Home</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
