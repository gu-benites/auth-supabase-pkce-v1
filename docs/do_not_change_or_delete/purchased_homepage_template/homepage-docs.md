
# Homepage Feature Documentation (Original Template)

**IMPORTANT NOTE:** The authentication state management (displaying login/logout buttons, user info, etc.) within the header components (`HeroHeader.tsx`, `MobileMenu.tsx`) described in this document has been **MODIFIED**. These components now integrate with the project's central authentication hook: `useAuth` from `src/features/auth/hooks/use-auth.ts`. The sign-out functionality also uses the project's `signOutUserAction` Server Action. Please refer to the current project code and `src/features/homepage/README.md` for the most up-to-date implementation details regarding authentication.

This document describes the structure and functionality of the **original purchased homepage template**.

## Table of Contents

1.  [Overview](#overview)
2.  [Responsibilities](#responsibilities)
3.  [Directory Structure](#directory-structure)
4.  [Key Components](#key-components)
    *   [`src/app/page.tsx`](#homepage-route)
    *   [`src/features/homepage/hero-section.tsx`](#hero-section-component)
    *   [`components/hero-header/hero-header.tsx`](#hero-header)
    *   [`components/hero-content/hero-content.tsx`](#hero-content)
    *   [`components/hero-canvas-background/hero-canvas-background.tsx`](#hero-canvas-background)
    *   [`components/rotating-text/rotating-text.tsx`](#rotating-text)
    *   [`components/shiny-text/shiny-text.tsx`](#shiny-text)
5.  [Key Functionality & Animations](#key-functionality--animations)
    *   [Interactive Canvas Background](#interactive-canvas-background)
    *   [Header Animations & Behavior](#header-animations--behavior)
    *   [Content Animations (Framer Motion)](#content-animations-framer-motion)
    *   [Rotating Text](#rotating-text-animation)
6.  [State Management](#state-management)
7.  [Constants & Types](#constants--types)

## Overview

The Homepage feature is the primary landing experience for users visiting the root URL (`/`) of the AuthFlow application. It's designed to be visually engaging and provide key information about the product, encouraging users to sign up or learn more. It features an interactive canvas background, animated text, and a responsive header with navigation.

## Responsibilities

*   Serve as the main entry point for the application.
*   Present branding and a value proposition.
*   Provide navigation to key areas like product information, pricing, documentation, login, and registration.
*   Offer a visually appealing and interactive user experience.

## Directory Structure

```
src/
├── app/
│   └── page.tsx                    # Root page route for the homepage
├── features/
│   └── homepage/
│       ├── hero-section.tsx          # Main orchestrating component for the homepage
│       ├── components/
│       │   ├── hero-canvas-background/
│       │   │   └── hero-canvas-background.tsx # Interactive dot matrix background
│       │   ├── hero-content/
│       │   │   ├── hero-content.tsx        # Main textual and image content of the hero
│       │   │   └── works-with-icons.tsx    # SVG icons for integrations
│       │   ├── hero-header/
│       │   │   ├── hero-header.tsx         # Main navigation header
│       │   │   ├── nav-link.tsx          # Individual navigation link component
│       │   │   ├── dropdown-menu.tsx       # Dropdown menu for header links
│       │   │   ├── dropdown-item.tsx       # Item within a dropdown menu
│       │   │   ├── mobile-menu.tsx         # Full-screen mobile navigation menu
│       │   │   └── icons.tsx               # SVG icons for the header (menu, close, etc.)
│       │   ├── rotating-text/
│       │   │   └── rotating-text.tsx       # Component for animated rotating text
│       │   └── shiny-text/
│       │       └── shiny-text.tsx          # Component for text with a shiny animation
│       ├── constants/
│       │   ├── index.ts
│       │   ├── hero-canvas-background-constants.ts
│       │   └── hero-header-constants.ts
│       ├── types/
│       │   ├── index.ts
│       │   ├── hero-canvas-background-types.ts
│       │   └── hero-header-types.ts
│       └── index.ts                    # Barrel file for easier imports
```

## Key Components

### Homepage Route
*   **File**: `src/app/page.tsx`
*   **Purpose**: This is the Next.js App Router entry point for the `/` path. It simply imports and renders the `HeroSection` component.

### `hero-section.tsx`
*   **File**: `src/features/homepage/hero-section.tsx`
*   **Purpose**: The main container component for the entire homepage. It orchestrates the `HeroHeader`, `HeroCanvasBackground`, and `HeroContent`.
*   **Structure**:
    *   Renders `HeroCanvasBackground` as a background layer.
    *   Includes a CSS gradient overlay for visual effect.
    *   Renders the `HeroHeader` (fixed position).
    *   Renders `HeroContent` within a `<main>` tag for the primary content.

### `hero-header.tsx`
*   **File**: `src/features/homepage/components/hero-header/hero-header.tsx`
*   **Purpose**: Provides the main navigation bar for the homepage.
*   **Features**:
    *   Fixed position at the top, with background blur and style changes on scroll (`isScrolled` state).
    *   Displays the logo (`NexusLogoIcon` and text `LOGO_TEXT`).
    *   Desktop navigation uses `NavLink` and `DropdownMenu` components, sourcing items from `NAV_ITEMS_DESKTOP`.
    *   Handles hover states for dropdowns with a slight delay for better UX.
    *   Authentication-dependent action buttons ("Register", "Sign In" or "Log Out", "Dashboard") are displayed based on `useAuthStore` (Zustand) state. `signOut` action comes from `useAuth` (TanStack Query).
    *   Includes a mobile menu toggle button (`MenuIcon`, `CloseIcon`) that activates `MobileMenu`.

### `hero-content.tsx`
*   **File**: `src/features/homepage/components/hero-content/hero-content.tsx`
*   **Purpose**: Contains the main marketing message, call-to-action, and visuals of the hero section.
*   **Features**:
    *   Uses `motion` components from `framer-motion` for staggered entrance animations of different content blocks (banner, headline, sub-headline, form, etc.).
    *   Integrates `ShinyText` for the announcement banner.
    *   Integrates `RotatingText` for the dynamic part of the main headline.
    *   Includes a mock email signup form (currently just UI, no action).
    *   Displays "Works with" icons (`SlackIcon`, `TeamsIcon`, etc.).
    *   Shows a placeholder product image.

### `hero-canvas-background.tsx`
*   **File**: `src/features/homepage/components/hero-canvas-background/hero-canvas-background.tsx`
*   **Purpose**: Renders an interactive dot matrix background using HTML5 Canvas.
*   **Functionality**:
    *   Generates a grid of dots based on `DOT_SPACING`.
    *   Dots have a base opacity and radius, defined in `hero-canvas-background-constants.ts`.
    *   Opacity pulses subtly using `OPACITY_PULSE_SPEED_MIN/MAX`.
    *   Dots react to mouse movement:
        *   Opacity and radius increase for dots within `INTERACTION_RADIUS` of the mouse.
        *   Effect is stronger closer to the mouse.
    *   Uses `requestAnimationFrame` for smooth animation.
    *   Uses a spatial hashing grid (`gridRef`) for optimizing mouse interaction checks.
    *   Color of the dots is configurable via a `color` prop (defaults to `var(--primary)`), parsed to RGB.
    *   Resizes with the window using `useWindowSize` hook.

### `rotating-text.tsx`
*   **File**: `src/features/homepage/components/rotating-text/rotating-text.tsx`
*   **Purpose**: A reusable component to display a series of texts that rotate one after another, with character-level stagger animations.
*   **Features**: Highly configurable via props for animation types, speed, stagger, looping, etc. Uses `framer-motion`.

### `shiny-text.tsx`
*   **File**: `src/features/homepage/components/shiny-text/shiny-text.tsx`
*   **Purpose**: A reusable component that adds a subtle animated shine effect to text or its children.
*   **Features**: Uses CSS animation with a linear gradient.

## Key Functionality & Animations

### Interactive Canvas Background
*   Managed by `HeroCanvasBackground`.
*   Dots change opacity and size based on mouse proximity.
*   Subtle pulsing opacity for a dynamic feel even without interaction.
*   Optimized using a grid for efficient hit detection.

### Header Animations & Behavior
*   Managed by `HeroHeader`.
*   Background color, border, and shadow change on page scroll using `framer-motion` variants (`top`, `scrolled`).
*   Dropdown menus use `framer-motion` for appear/disappear animations.
*   Mobile menu slides in/out.

### Content Animations (Framer Motion)
*   Managed by `HeroContent`.
*   Staggered entrance animations for various text blocks, form, and image using pre-defined `variants` and delays.

### Rotating Text Animation
*   Handled by the `RotatingText` component.
*   Words in the headline cycle through, with individual characters animating in.

## State Management

*   **`HeroHeader`**:
    *   `isScrolled` (local state): Tracks scroll position to change header style.
    *   `isMobileMenuOpen` (local state): Toggles the mobile menu.
    *   `openDropdown` (local state): Manages which desktop dropdown is currently active.
*   **`HeroCanvasBackground`**:
    *   `canvasSize` (local state): Manages canvas dimensions to trigger dot recreation on resize.
    *   `rgbColor` (local state): Stores the parsed dot color.
    *   `useRef` is used extensively for `canvasRef`, `dotsRef`, `gridRef`, `mousePositionRef` to manage canvas elements and animation state without triggering re-renders unnecessarily.
*   **`MobileMenu`**:
*   **`RotatingText`**:
    *   `currentTextIndex` (local state): Tracks the currently displayed text.

## Constants & Types
*   **Constants**:
    *   `src/features/homepage/constants/hero-header-constants.ts`: Defines `NAV_ITEMS_DESKTOP`, `NAV_ITEMS_MOBILE`, `LOGO_TEXT`.
    *   `src/features/homepage/constants/hero-canvas-background-constants.ts`: Defines parameters for the canvas animation (spacing, opacity, radius, interaction values).
*   **Types**:
    *   `src/features/homepage/types/hero-header-types.ts`: Defines `NavItem` and `DropdownItemData` for header navigation.
    *   `src/features/homepage/types/hero-canvas-background-types.ts`: Defines `Dot`, `MousePosition`, `DotGrid` for the canvas animation.

