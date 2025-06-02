// src/features/homepage/layout/homepage-layout.tsx
// This file was formerly src/features/homepage/hero-section.tsx
import React from 'react';
import HeroHeader from '../components/hero-header/hero-header';
import HeroCanvasBackground from '../components/hero-canvas-background/hero-canvas-background';
import HeroContent from '../components/hero-content/hero-content';

/**
 * The main orchestrating component for the homepage.
 * It combines the header, an interactive canvas background, and the primary hero content.
 * This component is static and does not depend on authentication state.
 *
 * @returns {JSX.Element} The complete hero section for the homepage.
 */
export const HomepageLayout: React.FC = () => { // Renamed component to HomepageLayout
  return (
    <section className="relative bg-background text-muted-foreground min-h-screen flex flex-col overflow-x-hidden pt-[70px]"> {/* Adjusted pt if header height is 70px */}
      {/* Canvas Background - z-0 */}
      <HeroCanvasBackground color="var(--primary)" />

      {/* Original Gradient Overlay - z-1 */}
      <div
        className="absolute inset-0 z-1 pointer-events-none"
        style={{
          background:
            'linear-gradient(to bottom, transparent 0%, hsl(var(--background)) 90%), radial-gradient(ellipse at center, transparent 40%, hsl(var(--background)) 95%)',
        }}
      />

      {/* Header - z-30 (Managed by HeroHeader itself, fixed position) */}
      <HeroHeader />

      {/* Content Area - z-10 */}
      <main className="flex-grow flex flex-col items-center justify-center text-center px-4 pt-8 pb-16 relative z-10">
        <HeroContent />
      </main>
    </section>
  );
};
