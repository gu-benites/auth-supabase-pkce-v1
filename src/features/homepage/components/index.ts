// src/features/homepage/components/index.ts
// This barrel file exports components from the 'src/features/homepage/components' directory.
export * from './homepage-layout';
// Do not export HeroSection from here if it's not in this directory.
// Do not export sub-components like HeroHeader, HeroCanvasBackground, HeroContent if they are only used internally by HeroSection.
