"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useMotionValueEvent, type Variants } from 'framer-motion';
// import { useScrollListener } from '../../../hooks/use-scroll-listener'; // Replaced by useScroll
// import { useWindowSize } from '../../../hooks'; // Not directly needed here, MobileMenu handles its own visibility
import NavLink from './nav-link';
import DropdownMenu from './dropdown-menu';
import MobileMenu from './mobile-menu';
import { MenuIcon, CloseIcon, NexusLogoIcon } from './icons';
import { NAV_ITEMS_DESKTOP, NAV_ITEMS_MOBILE, PRIMARY_BUTTON_TEXT, LOGO_TEXT } from '../../constants';
import { NavItem as NavItemType } from '../../types';

const HeroHeader: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 10);
  });
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  // Fix: Changed NodeJS.Timeout to ReturnType<typeof setTimeout> for browser compatibility.
  const dropdownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);


  const handleDropdownEnter = (label: string) => {
    if (dropdownTimeoutRef.current) {
        clearTimeout(dropdownTimeoutRef.current);
    }
    setOpenDropdown(label);
  };

  const handleDropdownLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
        setOpenDropdown(null);
    }, 100); // Small delay to allow moving mouse to dropdown
  };
  
  const closeDropdown = () => {
    setOpenDropdown(null);
  };
  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(prev => !prev);
  };

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);
  
  const headerVariants: Variants = {
    top: {
      backgroundColor: 'hsl(var(--background) / 0.8)',
      borderBottomColor: 'hsl(var(--border) / 0.5)',
      boxShadow: 'none',
    },
    scrolled: {
      backgroundColor: 'hsl(var(--background) / 0.95)',
      borderBottomColor: 'hsl(var(--border) / 0.7)',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    }
  };

  return (
    <motion.header
      ref={headerRef}
      variants={headerVariants}
      initial="top"
      animate={isScrolled ? 'scrolled' : 'top'}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="px-6 w-full md:px-10 lg:px-16 fixed top-0 left-0 right-0 z-30 backdrop-blur-md border-b"
    >
      <div className="container mx-auto px-0 sm:px-0 lg:px-0"> {/* Adjusted padding to match original structure */}
        <nav className="flex justify-between items-center max-w-screen-xl mx-auto h-[70px]">
          {/* Logo */}
          <a href="#" className="flex items-center flex-shrink-0 text-foreground">
            <NexusLogoIcon />
            <span className="text-xl font-bold ml-2">{LOGO_TEXT}</span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center justify-center flex-grow space-x-6 lg:space-x-8 px-4">
            {NAV_ITEMS_DESKTOP.map((item: NavItemType) => (
              <div 
                key={item.label} 
                className="relative"
                onMouseEnter={item.children ? () => handleDropdownEnter(item.label) : undefined}
                onMouseLeave={item.children ? handleDropdownLeave : undefined}
              >
                <NavLink
                  href={item.href}
                  label={item.label}
                  hasDropdown={!!item.children}
                  isOpen={openDropdown === item.label}
                  onClick={item.children ? (e) => { e.preventDefault(); handleDropdownEnter(item.label); } : closeDropdown}
                />
                {item.children && (
                  <DropdownMenu
                    items={item.children}
                    isOpen={openDropdown === item.label}
                    onClose={closeDropdown} 
                  />
                )}
              </div>
            ))}
          </div>
          
          {/* Desktop Action Buttons */}
          <div className="hidden md:flex items-center flex-shrink-0 space-x-4 lg:space-x-6">
             <NavLink href="/dashboard" label="Dashboard" isButton />
             <NavLink href="#book-demo" label={PRIMARY_BUTTON_TEXT} isButton isPrimary />
          </div>


          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <motion.button
              onClick={toggleMobileMenu}
              className="text-muted-foreground hover:text-foreground z-50 p-2 -mr-2" // Added padding for easier tap
              aria-label="Toggle menu"
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            >
              {isMobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
            </motion.button>
          </div>
        </nav>
      </div>
       {/* Mobile Menu - rendered outside the container to take full width */}
       <MobileMenu
        isOpen={isMobileMenuOpen}
        items={[...NAV_ITEMS_MOBILE, {label: PRIMARY_BUTTON_TEXT, href:"#book-demo", isButton:true, isPrimary:true, isMobileOnly: true}]}
        onClose={toggleMobileMenu}
        primaryButtonText={PRIMARY_BUTTON_TEXT} // This prop might be redundant if handled by items
        onPrimaryButtonClick={() => { toggleMobileMenu(); /* navigate to #book-demo */ }}
      />
    </motion.header>
  );
};

export default HeroHeader;