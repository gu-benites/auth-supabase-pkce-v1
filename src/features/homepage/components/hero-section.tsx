
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export function HeroSection() {
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
            <Link href="/">
              Reset Your Password
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/login">
              Access Your Account
            </Link>
          </Button>
        </div>
        <div className="relative aspect-video max-w-3xl mx-auto rounded-lg overflow-hidden shadow-2xl border">
          <Image
            src="https://placehold.co/1200x675.png"
            alt="PassForge application interface illustration"
            layout="fill"
            objectFit="cover"
            data-ai-hint="security interface"
            className="animate-fade-in"
          />
        </div>
      </div>
    </section>
  );
}
