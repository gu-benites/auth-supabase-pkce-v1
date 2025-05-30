"use client";

import React from 'react';
import { cn } from '../../../../lib/utils';

interface ShinyTextProps {
  text: string;
  className?: string;
  children?: React.ReactNode; // Allow children to be passed for more complex content if needed
}

const ShinyText: React.FC<ShinyTextProps> = ({ text, className = "", children }) => (
    <span className={cn("relative overflow-hidden inline-block", className)}>
        {children || text}
        <span style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
            animation: 'shinyTextInternalShine 2s infinite linear', // Use locally defined animation
            opacity: 0.5,
            pointerEvents: 'none'
        }}></span>
        {/* Define keyframes locally to ensure they are always available */}
        <style>{`
            @keyframes shinyTextInternalShine {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
            }
        `}</style>
    </span>
);
ShinyText.displayName = "ShinyText";
export default ShinyText;