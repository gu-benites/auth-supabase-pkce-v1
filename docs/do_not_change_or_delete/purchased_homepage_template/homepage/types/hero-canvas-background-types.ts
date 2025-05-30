export interface Dot {
  x: number;
  y: number;
  // baseColor: string; // Original had this, but we'll use DOT_RGB_COLOR and dynamic opacity
  
  targetOpacity: number;    // Target opacity for pulsing effect
  currentOpacity: number;   // Current opacity, affected by pulsing and interaction
  opacitySpeed: number;     // Speed of opacity pulsing
  
  baseRadius: number;       // Default radius
  currentRadius: number;    // Radius affected by interaction
}

export interface MousePosition {
  x: number | null;
  y: number | null;
}

// For the grid optimization
export type DotGrid = Record<string, number[]>; // cellKey: [dotIndex1, dotIndex2, ...]