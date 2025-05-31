'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function Header() {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;

  return (
    <header className="border-b">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold">
          AromaChat
        </Link>
        <nav className="flex items-center space-x-4">
          <Button
            variant={isActive('/') ? 'default' : 'ghost'}
            asChild
            className={cn(isActive('/') && 'bg-primary/90')}
          >
            <Link href="/">Home</Link>
          </Button>
          <Button
            variant={isActive('/chat') ? 'default' : 'ghost'}
            asChild
            className={cn(isActive('/chat') && 'bg-primary/90')}
          >
            <Link href="/chat">Chat</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
