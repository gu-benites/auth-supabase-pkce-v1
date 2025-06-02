// Providers like ThemeProvider handle their own client boundaries.
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import '../styles/globals.css';
import { Toaster } from "@/components/ui";
import { AuthSessionProvider, QueryClientProvider, ThemeProvider } from '@/providers';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

// Add basic metadata, which is good practice for Server Component layouts
export const metadata: Metadata = {
  title: 'PassForge',
  description: 'Secure password management by PassForge.',
};

/**
 * Root layout for the PassForge application.
 * Sets up global styles, fonts, and context providers.
 *
 * @param {object} props - The component's props.
 * @param {React.ReactNode} props.children - The child components to render.
 * @returns {JSX.Element} The root layout structure.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): JSX.Element {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
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
        </ThemeProvider>
      </body>
    </html>
  );
}
