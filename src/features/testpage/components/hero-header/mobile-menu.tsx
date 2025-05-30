"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavItem } from '../../types';
import NavLink from './nav-link';
import DropdownItem from './dropdown-item'; // For nested items in mobile if any
import { CloseIcon, ChevronDownIcon as ChevronDownIconImported } from './icons'; // Use imported ChevronDownIcon

interface MobileMenuProps {
  isOpen: boolean;
  items: NavItem[];
  onClose: () => void;
  primaryButtonText: string;
  onPrimaryButtonClick: () => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, items, onClose, primaryButtonText, onPrimaryButtonClick }) => {
  const mobileMenuVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.15, ease: "easeIn" } }
  };
  
  // Separate "Sign in" and "Book a demo" if they are special cases in mobile
  const regularItems = items.filter(item => !item.isButton && item.label !== 'Sign in');
  const signInItem = items.find(item => item.label === 'Sign in');


  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="mobile-menu"
          variants={mobileMenuVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="md:hidden absolute top-full left-0 right-0 bg-nexus-dark/95 backdrop-blur-sm shadow-lg py-4 border-t border-gray-800/50 z-40"
        >
          <div className="flex flex-col items-center space-y-3 px-6">
            {items.map((item) => (
              item.children ? (
                 <details key={item.label} className="group w-full text-center">
                    <summary className="flex items-center justify-center py-2 font-medium cursor-pointer text-gray-300 hover:text-white transition-colors duration-200">
                      {item.label}
                      <ChevronDownIconImported className="h-4 w-4 ml-1 transition-transform duration-200 group-open:rotate-180" />
                    </summary>
                    <div className="pl-4 pt-1 pb-2 space-y-2">
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
                  onClick={() => { item.href.startsWith('#') && onClose(); }} // Close if it's an anchor link
                  className="w-full text-center"
                  isButton={item.isButton}
                  isPrimary={item.isPrimary}
                />
              )
            ))}
            {/* Explicit "Sign In" if it was filtered out or needs special handling */}
            {signInItem && !signInItem.isButton && (
                 <NavLink
                    key={signInItem.label}
                    href={signInItem.href}
                    label={signInItem.label}
                    onClick={onClose}
                    className="w-full text-center"
                />
            )}
            {/* Separator for "Book a demo" which might be handled by NAV_ITEMS_MOBILE already */}
            {/* <hr className="w-full border-t border-gray-700/50 my-2"/> */}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MobileMenu;