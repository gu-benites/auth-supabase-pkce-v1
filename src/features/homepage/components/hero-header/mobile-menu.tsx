// src/features/homepage/components/hero-header/mobile-menu.tsx
"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import type { NavItem } from '../../types';
import NavLink from './nav-link';
import DropdownItem from './dropdown-item'; 
import { ChevronDownIcon as ChevronDownIconImported } from './icons'; 
import { useAuth } from '@/features/auth/hooks';
import { signOutUserAction } from '@/features/auth/actions';
import { cn } from '@/lib/utils';
import { Button, Separator } from '@/components/ui';
import { Loader2 } from 'lucide-react';

interface MobileMenuProps {
  isOpen: boolean;
  items: NavItem[]; 
  onClose: () => void;
}

/**
 * Renders the mobile navigation menu.
 * This menu is displayed on smaller screens and provides access to navigation links
 * and authentication actions (login, register, profile, logout).
 * It uses Framer Motion for animations and integrates with the `useAuth` hook for auth state.
 *
 * @param {MobileMenuProps} props - The component's props.
 * @param {boolean} props.isOpen - Whether the mobile menu is currently open.
 * @param {NavItem[]} props.items - Array of general navigation items.
 * @param {() => void} props.onClose - Function to call when the menu should be closed.
 * @returns {JSX.Element | null} The mobile menu component or null if not open.
 */
const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, items, onClose }) => {
  const mobileMenuVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.15, ease: "easeIn" } }
  };

  const { isAuthenticated, isSessionLoading } = useAuth(); // Use session-specific loading

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
            {/* General Navigation Items */}
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

            {/* Auth-dependent Actions */}
            {isSessionLoading ? ( // Use session-specific loading
               <Loader2 className="h-6 w-6 animate-spin text-primary my-2" />
            ) : isAuthenticated ? (
              <>
                <Button variant="default" asChild size="sm" className="w-full my-1" onClick={onClose}>
                  <Link href="/profile">Profile</Link>
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
                  <Link href="/register">Sign Up</Link>
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
