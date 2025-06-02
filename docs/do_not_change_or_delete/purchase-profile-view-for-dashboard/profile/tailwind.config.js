
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './index.html',
    './App.tsx',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        // Shadcn UI Dialog animations (approximated, tailwindcss-animate plugin is better)
        "fade-in-0": { from: { opacity: "0" }, to: { opacity: "1" } },
        "fade-out-0": { from: { opacity: "1" }, to: { opacity: "0" } },
        "zoom-in-95": { from: { opacity: "0", transform: "scale(.95)" }, to: { opacity: "1", transform: "scale(1)" } },
        "zoom-out-95": { from: { opacity: "1", transform: "scale(1)" }, to: { opacity: "0", transform: "scale(.95)" } },
        "slide-in-from-left-1/2": { from: { transform: "translateX(-50%)" }, to: { transform: "translateX(0)" } }, // Simplified
        "slide-in-from-top-[48%]": { from: { transform: "translateY(-48%)" }, to: { transform: "translateY(0)" } }, // Simplified
        "slide-out-to-left-1/2": { from: { transform: "translateX(0)" }, to: { transform: "translateX(-50%)" } }, // Simplified
        "slide-out-to-top-[48%]": { from: { transform: "translateY(0)" }, to: { transform: "translateY(-48%)" } }, // Simplified
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in-0": "fade-in-0 0.2s ease-out",
        "fade-out-0": "fade-out-0 0.2s ease-out",
        "zoom-in-95": "zoom-in-95 0.2s ease-out",
        "zoom-out-95": "zoom-out-95 0.2s ease-out",
        "slide-in-from-left-1/2": "slide-in-from-left-1/2 0.3s ease-out",
        "slide-in-from-top-[48%]": "slide-in-from-top-[48%] 0.3s ease-out",
        "slide-out-to-left-1/2": "slide-out-to-left-1/2 0.3s ease-out",
        "slide-out-to-top-[48%]": "slide-out-to-top-[48%] 0.3s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")], // For full animation support, but CDN won't use this directly. Kept for reference.
                                            // The keyframes above are a partial substitute for CDN.
};
