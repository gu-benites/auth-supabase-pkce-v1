import React from 'react';
import HeroHeader from './components/hero-header/hero-header';
import HeroCanvasBackground from './components/hero-canvas-background/hero-canvas-background';
import HeroContent from './components/hero-content/hero-content';

export const HeroSection: React.FC = () => {
  return (
    <section className="relative bg-background text-muted-foreground min-h-screen flex flex-col overflow-x-hidden pt-[100px]">
      {/* Canvas Background - z-0 */}
      <HeroCanvasBackground color="var(--primary)" />

      {/* Original Gradient Overlay - z-1 */}
      <div 
        className="absolute inset-0 z-1 pointer-events-none"
        style={{
            background: 'linear-gradient(to bottom, transparent 0%, hsl(var(--background)) 90%), radial-gradient(ellipse at center, transparent 40%, hsl(var(--background)) 95%)'
        }}
      />
      
      {/* Header - z-30 (Managed by HeroHeader itself, fixed position) */}
      <HeroHeader />

      {/* Content Area - z-10 */}
      {/* Original bckup-hero-section.tsx <main> classes: "flex-grow flex flex-col items-center justify-center text-center px-4 pt-8 pb-16 relative z-10" */}
      {/* The pt-[100px] on the section already accounts for header. The internal pt-8 provides additional spacing for the content block. */}
      <main className="flex-grow flex flex-col items-center justify-center text-center px-4 pt-8 pb-16 relative z-10">
        <HeroContent />
      </main>
      
      {/* No bottom vignette from original bckup-hero-section.tsx */}
    </section>
  );
};