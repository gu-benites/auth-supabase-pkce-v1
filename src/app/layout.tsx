import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { PHProvider } from '@/components/providers/posthog-provider'; // Assuming PostHog is set up, if not, this can be removed or conditional.
import dynamic from 'next/dynamic';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'PassForge - Secure Password Reset',
  description: 'Easily and securely reset your password with PassForge.',
};

// Dynamically import PostHogPageview to ensure it's client-side only
const PostHogPageview = dynamic(() => import('@/components/analytics/posthog-pageview').then(mod => mod.PostHogPageview), {
  ssr: false,
});


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <PHProvider>
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          <PostHogPageview />
          {children}
          <Toaster />
        </body>
      </PHProvider>
    </html>
  );
}
