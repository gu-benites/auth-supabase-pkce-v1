import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { PHProvider } from '@/components/providers/posthog-provider';
import { DynamicPostHogPageview } from '@/components/analytics/dynamic-posthog-pageview';

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <PHProvider>
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          <DynamicPostHogPageview />
          {children}
          <Toaster />
        </body>
      </PHProvider>
    </html>
  );
}
