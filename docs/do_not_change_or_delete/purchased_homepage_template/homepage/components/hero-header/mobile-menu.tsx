
"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { NavItem } from '../../types';
import NavLink from './nav-link';
import DropdownItem from './dropdown-item'; 
import { CloseIcon, ChevronDownIcon as ChevronDownIconImported } from './icons'; 
import { useAuthStore } from '@/store/auth.store';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

interface MobileMenuProps {
  isOpen: boolean;
  items: NavItem[]; // These are the general navigation items like Product, Pricing etc.
  onClose: () => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, items, onClose }) => {
  const mobileMenuVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.15, ease: "easeIn" } }
  };

  const { isAuthenticated, isLoading: isLoadingAuth } = useAuthStore();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    onClose();
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
                  onClick={() => { if (item.href.startsWith('#')) onClose(); else onClose(); }} // Close on any link click for mobile
                  className="w-full text-center py-2"
                  isButton={item.isButton} // Allows for primary button styling if needed for non-auth items
                  isPrimary={item.isPrimary}
                />
              )
            ))}

            <Separator className="my-3 w-full" />

            {/* Auth-dependent Actions */}
            {isLoadingAuth ? (
              <>
                <div className="h-8 w-3/4 bg-muted rounded animate-pulse my-1" />
                <div className="h-10 w-full bg-muted rounded-md animate-pulse my-1" />
              </>
            ) : isAuthenticated ? (
              <>
                <NavLink
                  href="/dashboard"
                  label="Dashboard"
                  onClick={onClose}
                  className="w-full text-center"
                  isButton
                  isPrimary
                />
                <button
                  onClick={handleSignOut}
                  className={cn(
                    "text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200 py-2 w-full text-center"
                  )}
                >
                  Log Out
                </button>
              </>
            ) : (
              <>
                <NavLink
                  href="/register"
                  label="Register"
                  onClick={onClose}
                  className="w-full text-center py-2"
                />
                <NavLink
                  href="/login"
                  label="Sign In"
                  onClick={onClose}
                  className="w-full text-center"
                  isButton
                  isPrimary
                />
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MobileMenu;
