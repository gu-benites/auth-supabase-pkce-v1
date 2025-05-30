// Constants from bckup-hero-section.tsx (InteractiveHero)

// Dot Appearance & Interaction
export const DOT_SPACING = 25;          // Spacing between dots in the grid
export const BASE_OPACITY_MIN = 0.40;   // Minimum base opacity for a dot
export const BASE_OPACITY_MAX = 0.50;   // Maximum base opacity for a dot (also used for baseColor alpha)
export const BASE_RADIUS = 1;           // Base radius of dots

export const INTERACTION_RADIUS = 150;  // Radius of mouse interaction
export const INTERACTION_RADIUS_SQ = INTERACTION_RADIUS * INTERACTION_RADIUS; // Pre-calculated

export const OPACITY_BOOST = 0.6;       // How much opacity increases on interaction (additive)
export const RADIUS_BOOST = 2.5;        // How much radius increases on interaction (additive)

// Grid Optimization
// Larger cell size means fewer cells to check, but might miss some dots if INTERACTION_RADIUS is small relative to cell size.
// Original: Math.max(50, Math.floor(INTERACTION_RADIUS / 1.5));
export const GRID_CELL_SIZE = Math.max(50, Math.floor(INTERACTION_RADIUS / 1.5)); // For spatial hashing to optimize dot searching

// Dot color is now dynamically set from the theme's primary color

// Dot animation speed (for pulsing opacity)
export const OPACITY_PULSE_SPEED_MIN = 0.002;
export const OPACITY_PULSE_SPEED_MAX = 0.005;