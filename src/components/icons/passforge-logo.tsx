import React from 'react';

interface PassForgeLogoProps extends React.SVGProps<SVGSVGElement> {
  // You can add any specific props for your logo here
}

export function PassForgeLogo({ className, ...props }: PassForgeLogoProps) {
  return (
    <svg
      className={className}
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="PassForge Logo"
      {...props}
    >
      <path
        d="M18 20H12C9.79086 20 8 21.7909 8 24V36C8 38.2091 9.79086 40 12 40H18"
        stroke="hsl(var(--primary))" 
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M30 8H36C38.2091 8 40 9.79086 40 12V24C40 26.2091 38.2091 28 36 28H30"
        stroke="hsl(var(--primary))"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18 20V14C18 10.6863 20.6863 8 24 8C27.3137 8 30 10.6863 30 14V28C30 31.3137 27.3137 34 24 34C20.6863 34 18 31.3137 18 28V20Z"
        stroke="hsl(var(--accent))" 
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
