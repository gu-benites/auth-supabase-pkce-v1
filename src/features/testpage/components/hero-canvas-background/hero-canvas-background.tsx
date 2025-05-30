"use client";

import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
  DOT_SPACING, BASE_OPACITY_MIN, BASE_OPACITY_MAX, BASE_RADIUS,
  INTERACTION_RADIUS, INTERACTION_RADIUS_SQ, OPACITY_BOOST, RADIUS_BOOST,
  GRID_CELL_SIZE, OPACITY_PULSE_SPEED_MIN, OPACITY_PULSE_SPEED_MAX
} from '../../constants';
import { Dot, MousePosition, DotGrid } from '../../types';
import { useWindowSize } from '../../../../hooks'; 

interface HeroCanvasBackgroundProps {
  color?: string; // CSS variable name or hex/rgb value
}

const HeroCanvasBackground: React.FC<HeroCanvasBackgroundProps> = ({ 
  color = 'var(--primary)' 
}) => {
  const [rgbColor, setRgbColor] = useState({ r: 161, g: 134, b: 190 }); // Default fallback color (purple)

  // Only run once when component mounts
  useEffect(() => {
    try {
      // Create a single hidden element
      const el = document.createElement('div');
      el.style.color = color;
      el.style.display = 'none';
      document.body.appendChild(el);
      
      // Get computed color once
      const computedColor = getComputedStyle(el).color;
      document.body.removeChild(el);
      
      // Parse the color (format: "rgb(r, g, b)" or "rgba(r, g, b, a)")
      const rgb = computedColor.match(/\d+/g)?.map(Number);
      if (rgb && rgb.length >= 3) {
        // Ensure all values are valid numbers
        const [r, g, b] = rgb;
        if (typeof r === 'number' && typeof g === 'number' && typeof b === 'number') {
          setRgbColor({ r, g, b });
        }
      }
    } catch (e) {
      console.warn('Failed to parse color, using fallback', e);
    }
  }, [color]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  
  const dotsRef = useRef<Dot[]>([]);
  const gridRef = useRef<DotGrid>({});
  const mousePositionRef = useRef<MousePosition>({ x: null, y: null });
  
  // Use a state for canvas dimensions to trigger re-creation of dots if needed
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const { width: windowWidth, height: windowHeight } = useWindowSize();


  const createDots = useCallback(() => {
    const { width, height } = canvasSize;
    if (width === 0 || height === 0 || !canvasRef.current) return;

    const newDots: Dot[] = [];
    const newGrid: DotGrid = {};
    const cols = Math.ceil(width / DOT_SPACING);
    const rows = Math.ceil(height / DOT_SPACING);

    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const x = i * DOT_SPACING + DOT_SPACING / 2;
        const y = j * DOT_SPACING + DOT_SPACING / 2;
        
        // Grid calculation
        const cellX = Math.floor(x / GRID_CELL_SIZE);
        const cellY = Math.floor(y / GRID_CELL_SIZE);
        const cellKey = `${cellX}_${cellY}`;

        if (!newGrid[cellKey]) {
          newGrid[cellKey] = [];
        }
        const dotIndex = newDots.length;
        newGrid[cellKey].push(dotIndex);

        const baseOpacity = Math.random() * (BASE_OPACITY_MAX - BASE_OPACITY_MIN) + BASE_OPACITY_MIN;
        const opacitySpeed = (Math.random() * (OPACITY_PULSE_SPEED_MAX - OPACITY_PULSE_SPEED_MIN)) + OPACITY_PULSE_SPEED_MIN;

        newDots.push({
          x,
          y,
          targetOpacity: baseOpacity,
          currentOpacity: baseOpacity, // Start with base opacity
          opacitySpeed: Math.random() > 0.5 ? opacitySpeed : -opacitySpeed, // Randomize initial pulse direction
          baseRadius: BASE_RADIUS,
          currentRadius: BASE_RADIUS,
        });
      }
    }
    dotsRef.current = newDots;
    gridRef.current = newGrid;
  }, [canvasSize]); // Depends on canvasSize state

  // Effect to setup canvas and initial dots creation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const parentElement = canvas.parentElement;
    const newWidth = parentElement ? parentElement.clientWidth : windowWidth;
    const newHeight = parentElement ? parentElement.clientHeight : windowHeight;

    canvas.width = newWidth * dpr;
    canvas.height = newHeight * dpr;
    canvas.style.width = `${newWidth}px`;
    canvas.style.height = `${newHeight}px`;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }
    
    setCanvasSize({ width: newWidth, height: newHeight });
    // createDots will be called by the useEffect depending on canvasSize
  }, [windowWidth, windowHeight]); // Re-run if window size changes

  // Effect to recreate dots when canvasSize actually changes
  useEffect(() => {
    createDots();
  }, [createDots]);


  const handleMouseMove = useCallback((event: globalThis.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      mousePositionRef.current = { x: null, y: null };
      return;
    }
    const rect = canvas.getBoundingClientRect();
    mousePositionRef.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }, []);
  
  const handleMouseLeave = useCallback(() => {
    mousePositionRef.current = { x: null, y: null };
  }, []);


  const animateDots = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const dots = dotsRef.current;
    const grid = gridRef.current;
    const { width, height } = canvasSize; // Use state for current canvas dimensions
    const { x: mouseX, y: mouseY } = mousePositionRef.current;

    if (!ctx || !dots || !grid || width === 0 || height === 0) {
      animationFrameIdRef.current = requestAnimationFrame(animateDots);
      return;
    }

    ctx.clearRect(0, 0, width, height);

    const activeDotIndices = new Set<number>();
    if (mouseX !== null && mouseY !== null) {
      const mouseCellX = Math.floor(mouseX / GRID_CELL_SIZE);
      const mouseCellY = Math.floor(mouseY / GRID_CELL_SIZE);
      const searchRadius = Math.ceil(INTERACTION_RADIUS / GRID_CELL_SIZE); // How many cells to check around mouse

      for (let i = -searchRadius; i <= searchRadius; i++) {
        for (let j = -searchRadius; j <= searchRadius; j++) {
          const checkCellX = mouseCellX + i;
          const checkCellY = mouseCellY + j;
          const cellKey = `${checkCellX}_${checkCellY}`;
          if (grid[cellKey]) {
            grid[cellKey].forEach(dotIndex => activeDotIndices.add(dotIndex));
          }
        }
      }
    }

    dots.forEach((dot, index) => {
      // Opacity pulsing
      dot.currentOpacity += dot.opacitySpeed;
      if (dot.currentOpacity >= dot.targetOpacity || dot.currentOpacity <= BASE_OPACITY_MIN) {
        dot.opacitySpeed *= -1; // Reverse direction
        // Clamp opacity
        dot.currentOpacity = Math.max(BASE_OPACITY_MIN, Math.min(dot.currentOpacity, BASE_OPACITY_MAX));
        // Set a new target opacity for next pulse cycle (optional, or keep fixed target)
        // dot.targetOpacity = Math.random() * (BASE_OPACITY_MAX - BASE_OPACITY_MIN) + BASE_OPACITY_MIN;
      }
      
      let interactionFactor = 0;
      dot.currentRadius = dot.baseRadius; // Reset radius

      if (mouseX !== null && mouseY !== null && activeDotIndices.has(index)) {
        const dx = dot.x - mouseX;
        const dy = dot.y - mouseY;
        const distSq = dx * dx + dy * dy;

        if (distSq < INTERACTION_RADIUS_SQ) {
          const distance = Math.sqrt(distSq);
          // Interaction factor is stronger closer to the mouse
          interactionFactor = Math.max(0, 1 - distance / INTERACTION_RADIUS);
          interactionFactor = interactionFactor * interactionFactor; // Make falloff steeper
        }
      }
      
      // Apply interaction effects
      const finalOpacity = Math.min(1, dot.currentOpacity + interactionFactor * OPACITY_BOOST);
      dot.currentRadius = dot.baseRadius + interactionFactor * RADIUS_BOOST;
      
      // Use the pre-parsed RGB color
      ctx.beginPath();
      ctx.fillStyle = `rgba(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b}, ${finalOpacity.toFixed(3)})`;
      ctx.arc(dot.x, dot.y, dot.currentRadius, 0, Math.PI * 2);
      ctx.fill();
    });

    animationFrameIdRef.current = requestAnimationFrame(animateDots);
  }, [canvasSize]); // Depends on canvasSize for width/height

  useEffect(() => {
    // Listen on window for mouse move as in original, but document for mouse leave.
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.documentElement.addEventListener('mouseleave', handleMouseLeave);

    animationFrameIdRef.current = requestAnimationFrame(animateDots);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.documentElement.removeEventListener('mouseleave', handleMouseLeave);
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [animateDots, handleMouseMove, handleMouseLeave]);


  return <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none opacity-80" />;
};

export default HeroCanvasBackground;