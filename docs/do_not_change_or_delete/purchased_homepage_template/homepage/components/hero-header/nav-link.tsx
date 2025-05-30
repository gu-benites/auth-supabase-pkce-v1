"use client";

import React from 'react';  
import { motion } from 'framer-motion';
import { ChevronDownIcon } from './icons';
import { cn } from '../../../../lib/utils';

interface NavLinkProps {
  href?: string;
  label: string;
  hasDropdown?: boolean;
  isOpen?: boolean; // To indicate if the associated dropdown is open
  onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
  className?: string;
  isButton?: boolean;
  isPrimary?: boolean;
}

const NavLink: React.FC<NavLinkProps> = ({
  href = "#",
  label,
  hasDropdown = false,
  isOpen = false,
  onClick,
  className = "",
  isButton = false,
  isPrimary = false,
}) => {
  if (isButton) {
    // Styling for "Book a demo" button from bckup-hero-section.tsx
    const buttonClasses = isPrimary
      ? "bg-primary text-primary-foreground px-4 py-[6px] rounded-md text-sm font-semibold hover:bg-primary/90 transition-colors duration-200 whitespace-nowrap shadow-sm hover:shadow-md"
      : "text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200 py-1"; // For "Sign in" like button

    return (
      <motion.a
        href={href}
        onClick={onClick}
        className={cn(buttonClasses, className)}
        whileHover={isPrimary ? { scale: 1.03, y: -1 } : {}}
        whileTap={isPrimary ? { scale: 0.97 } : {}}
        transition={isPrimary ? { type: "spring", stiffness: 400, damping: 15 } : {}}
      >
        {label}
      </motion.a>
    );
  }

  return (
    <motion.a
      href={href}
      onClick={onClick}
      className={cn(
        "text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200 py-1 relative group",
        { 'text-foreground': isOpen && hasDropdown },
        className
      )}
      whileHover="hover"
      onFocusCapture={onClick as unknown as React.FocusEventHandler<HTMLAnchorElement>}
      onBlurCapture={(e) => {
        if (hasDropdown && isOpen && !e.currentTarget.parentNode?.contains(e.relatedTarget as Node)) {
          // Potentially call a close dropdown function if focus moves completely out
        }
      }}
    >
      {label}
      {hasDropdown && (
        <motion.div 
          className="inline-flex items-center"
          animate={{ rotate: isOpen ? 180 : 0 }} 
          transition={{ duration: 0.2 }}
        >
          <ChevronDownIcon className="w-3 h-3 ml-1 transition-transform duration-200 group-hover:rotate-180" />
        </motion.div>
      )}
      {!hasDropdown && (
        <motion.div
          className="absolute bottom-[-2px] left-0 right-0 h-[1px] bg-primary"
          variants={{ 
            initial: { scaleX: 0, originX: 0.5 }, 
            hover: { scaleX: 1, originX: 0.5 } 
          }}
          initial="initial"
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
      )}
    </motion.a>
  );
};

export default NavLink;