
import React from 'react';
import Image from 'next/image';

interface AuthLayoutProps {
  children: React.ReactNode;
}

/**
 * Shared layout for authentication pages (login, register, forgot-password, reset-password).
 * Provides a two-column structure: a left column for branding/static content and a right column
 * for the specific authentication form.
 * This layout is automatically applied to pages within the /app/(auth)/ route group.
 *
 * @param {AuthLayoutProps} props - The component props.
 * @param {React.ReactNode} props.children - The page content (e.g., Login page, Register page) to be rendered in the right column.
 * @returns {JSX.Element} The two-column authentication layout.
 */
export default function AuthLayout({ children }: AuthLayoutProps): JSX.Element {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 min-h-screen bg-background">
      {/* Left Column (Branding/Static Content) */}
      <div className="hidden md:flex flex-col items-center justify-center bg-muted/50 p-8 lg:p-12 border-r border-border">
        <div className="text-center space-y-6">
          <Image
            src="https://placehold.co/600x400.png"
            alt="PassForge Authentication"
            width={400}
            height={267}
            className="rounded-lg shadow-xl mx-auto"
            data-ai-hint="security abstract"
          />
          <h1 className="text-4xl font-bold text-primary">PassForge</h1>
          <p className="text-lg text-muted-foreground max-w-sm mx-auto">
            Secure your digital life with PassForge. Effortless and robust password management.
          </p>
        </div>
      </div>

      {/* Right Column (Authentication Form Content) */}
      <div className="flex flex-col items-center justify-center p-4 sm:p-8 lg:p-12">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
}
