"use client"

import { useState, useEffect } from "react"
import { Moon, Sun } from "lucide-react"
import { cn } from "@/lib/utils"

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark");
    }
    return false;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(prevIsDark => !prevIsDark);
  };

  return (
    <div
      className={cn(
        "flex w-16 h-8 p-1 rounded-full cursor-pointer transition-all duration-300",
        "bg-secondary border border-border",
        className
      )}
      onClick={toggleTheme}
      role="button"
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          toggleTheme();
        }
      }}
    >
      <div className="relative flex justify-between items-center w-full h-full">
        <div
          className={cn(
            "z-10 flex justify-center items-center w-6 h-6 rounded-full transition-transform duration-300",
            "bg-primary",
            isDark 
              ? "transform translate-x-0" 
              : "transform translate-x-8"
          )}
        >
          {isDark ? (
            <Moon 
              className="w-4 h-4 text-primary-foreground" 
              strokeWidth={1.5}
              aria-hidden="true"
            />
          ) : (
            <Sun 
              className="w-4 h-4 text-primary-foreground" 
              strokeWidth={1.5}
              aria-hidden="true"
            />
          )}
        </div>
        
        <div
          className={cn(
            "absolute flex justify-center items-center w-6 h-6 rounded-full",
            "top-1/2 -translate-y-1/2",
            isDark 
              ? "right-1 opacity-100"
              : "left-1 opacity-100"
          )}
        >
          {isDark ? (
            <Sun 
              className="w-4 h-4 text-secondary-foreground" 
              strokeWidth={1.5}
              aria-hidden="true"
            />
          ) : (
            <Moon 
              className="w-4 h-4 text-secondary-foreground" 
              strokeWidth={1.5}
              aria-hidden="true"
            />
          )}
        </div>
      </div>
    </div>
  )
}