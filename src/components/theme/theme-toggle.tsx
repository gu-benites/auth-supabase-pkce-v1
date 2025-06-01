
"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // To prevent hydration mismatch and layout shifts, render a placeholder.
    // This div is styled to roughly match the dimensions of the actual toggle.
    return <div className={cn("flex w-16 h-8 p-1 rounded-full bg-secondary border border-border animate-pulse", className)} />;
  }

  const isCurrentlyDark = resolvedTheme === "dark"

  const toggleTheme = () => {
    setTheme(isCurrentlyDark ? "light" : "dark")
  }

  return (
    <div
      className={cn(
        "flex w-16 h-8 p-1 rounded-full cursor-pointer transition-colors duration-300 ease-in-out",
        "bg-secondary border border-border hover:border-primary/50",
        className
      )}
      onClick={toggleTheme}
      role="button"
      aria-pressed={isCurrentlyDark}
      aria-label={`Switch to ${isCurrentlyDark ? 'light' : 'dark'} mode`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleTheme();
        }
      }}
    >
      <div className="relative flex items-center w-full h-full">
        {/* Moving Knob */}
        <div
          className={cn(
            "z-10 flex justify-center items-center w-6 h-6 rounded-full transition-transform duration-300 ease-in-out",
            "bg-primary shadow-md", 
            isCurrentlyDark
              ? "transform translate-x-8" // Knob on the right for dark mode
              : "transform translate-x-0"  // Knob on the left for light mode
          )}
        >
          {isCurrentlyDark ? (
            <Moon
              className="w-4 h-4 text-primary-foreground"
              strokeWidth={1.75}
              aria-hidden="true"
            />
          ) : (
            <Sun
              className="w-4 h-4 text-primary-foreground"
              strokeWidth={1.75}
              aria-hidden="true"
            />
          )}
        </div>

        {/* Static background icons */}
        {/* Sun icon (always on the left) */}
        <div
          className={cn(
            "absolute flex justify-center items-center w-6 h-6",
            "top-1/2 -translate-y-1/2 left-[3px] transition-opacity duration-300", // Adjusted left padding for icon
            !isCurrentlyDark ? "opacity-0" : "opacity-50" // Hidden when light, visible but dimmed when dark (knob covers it)
          )}
        >
           <Sun
              className="w-4 h-4 text-secondary-foreground" 
              strokeWidth={1.5}
              aria-hidden="true"
            />
        </div>
         {/* Moon icon (always on the right) */}
        <div
          className={cn(
            "absolute flex justify-center items-center w-6 h-6",
            "top-1/2 -translate-y-1/2 right-[3px] transition-opacity duration-300", // Adjusted right padding for icon
            isCurrentlyDark ? "opacity-0" : "opacity-50" // Hidden when dark, visible but dimmed when light (knob covers it)
          )}
        >
            <Moon
              className="w-4 h-4 text-secondary-foreground"
              strokeWidth={1.5}
              aria-hidden="true"
            />
        </div>
      </div>
    </div>
  )
}
