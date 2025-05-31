// src/features/homepage/components/hero-header/mobile-menu.tsx
"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import type { NavItem } from '../../types';
import NavLink from './nav-link';
import DropdownItem from './dropdown-item'; 
import { ChevronDownIcon as ChevronDownIconImported } from './icons'; 
import { signOutUserAction } from '@/features/auth/actions';
import { Button, Separator } from '@/components/ui';
import { Loader2 } from 'lucide-react';

interface MobileMenuProps {
  isOpen: boolean;
  items: NavItem[]; 
  onClose: () => void;
  isSessionLoading: boolean; // Prop for session loading state (now includes mounted check)
  isAuthenticated: boolean; // Prop for basic authentication state (now includes mounted check)
}

/**
 * Renders the mobile navigation menu.
 * Authentication state (isSessionLoading, isAuthenticated) is passed as props.
 *
 * @param {MobileMenuProps} props - The component's props.
 * @returns {JSX.Element | null} The mobile menu component or null if not open.
 */
const MobileMenu: React.FC<MobileMenuProps> = ({ 
  isOpen, 
  items, 
  onClose,
  isSessionLoading, // Use passed prop (which now considers HeroHeader's mounted state)
  isAuthenticated, // Use passed prop (which now considers HeroHeader's mounted state)
}) => {
  const mobileMenuVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.15, ease: "easeIn" } }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="mobile-menu"
          variants={mobileMenuVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="md:hidden absolute top-full left-0 right-0 bg-background/95 backdrop-blur-sm shadow-lg py-4 border-t border-border/50 z-40 max-h-[calc(100vh-70px)] overflow-y-auto"
        >
          <div className="flex flex-col items-center space-y-1 px-6 pb-4">
            {items.map((item) => (
              item.children ? (
                 <details key={item.label} className="group w-full text-center">
                    <summary className="flex items-center justify-center py-2 font-medium cursor-pointer text-muted-foreground hover:text-foreground transition-colors duration-200">
                      {item.label}
                      <ChevronDownIconImported className="h-4 w-4 ml-1 transition-transform duration-200 group-open:rotate-180" />
                    </summary>
                    <div className="pl-4 pt-1 pb-2 space-y-1">
                      {item.children.map(child => (
                        <DropdownItem key={child.label} {...child} onClick={onClose} />
                      ))}
                    </div>
                  </details>
              ) : (
                <NavLink
                  key={item.label}
                  href={item.href}
                  label={item.label}
                  onClick={() => { if (item.href && item.href.startsWith('#')) onClose(); else onClose(); }}
                  className="w-full text-center py-2"
                  isButton={item.isButton}
                  isPrimary={item.isPrimary}
                />
              )
            ))}

            <Separator className="my-3 w-full" />

            {isSessionLoading ? ( // This prop now reflects HeroHeader's `!mounted || isSessionLoading`
               <Loader2 className="h-6 w-6 animate-spin text-primary my-2" />
            ) : isAuthenticated ? ( // This prop now reflects HeroHeader's `mounted && currentIsAuthenticated`
              <>
                <Button variant="default" asChild size="sm" className="w-full my-1" onClick={onClose}>
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
                <form action={signOutUserAction} className="w-full">
                    <Button
                    variant="ghost"
                    type="submit"
                    className="w-full text-muted-foreground hover:text-foreground"
                    onClick={onClose}
                    >
                    Log Out
                    </Button>
                </form>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild size="sm" className="w-full my-1" onClick={onClose}>
                  <Link href="/login">Login</Link>
                </Button>
                <Button variant="default" asChild size="sm" className="w-full my-1" onClick={onClose}>
                  <Link href="/register">Register</Link>
                </Button>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MobileMenu;
