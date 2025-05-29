
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui";
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

/**
 * Metadata for the application.
 * @see https://nextjs.org/docs/app/api-reference/functions/generate-metadata
 */
export const metadata: Metadata = {
  title: 'PassForge - Secure Password Reset',
  description: 'Easily and securely reset your password with PassForge.',
};

/**
 * Root layout component for the PassForge application.
 * It sets up global fonts, providers, and the basic HTML structure.
 *
 * @param {object} props - The properties for the component.
 * @param {React.ReactNode} props.children - The child components to be rendered within this layout.
 * @returns {JSX.Element} The root layout structure.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): JSX.Element {
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
