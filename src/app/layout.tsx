'use client';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google'; // Ensure these are correctly configured
import '../styles/globals.css';
import { Toaster } from "@/components/ui"; // Ensure this path is correct for your Toaster
import { AuthSessionProvider, QueryClientProvider, ThemeProvider } from '@/providers'; // See note on Client Components
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap', // Recommended for next/font
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap', // Recommended for next/font
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): JSX.Element {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthSessionProvider> {/* Auth provider wraps QueryClientProvider */}
            <QueryClientProvider>
              {children}
              <Toaster />
              {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
            </QueryClientProvider>
          </AuthSessionProvider>
        </ThemeProvider> {/* ThemeProvider is now correctly closed */}
      </body> {/* Body tag now correctly wraps all content and providers */}
    </html>
  );
}