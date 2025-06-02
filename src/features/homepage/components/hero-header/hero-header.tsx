
// src/features/homepage/components/hero-header/hero-header.tsx
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useMotionValueEvent, type Variants } from 'framer-motion';
import Link from 'next/link';
import NavLink from './nav-link';
import DropdownMenu from './dropdown-menu';
import MobileMenu from './mobile-menu';
import { MenuIcon, CloseIcon } from './icons';
import { NAV_ITEMS_DESKTOP, NAV_ITEMS_MOBILE, LOGO_TEXT } from '../../constants';
import type { NavItem as NavItemType } from '../../types';
import { useAuth } from '@/features/auth/hooks';
import { signOutUserAction } from '@/features/auth/actions';
import { Button } from '@/components/ui/button';
import { PassForgeLogo } from '@/components/icons';
import { UserCircle2 } from 'lucide-react'; // Loader2 removed as skeletons handle loading state
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Renders the main header for the homepage.
 * It includes the application logo, desktop navigation links,
 * a mobile menu toggle, and authentication-related action buttons.
 * Authentication state is managed via the `useAuth` hook.
 *
 * @returns {JSX.Element} The homepage header component.
 */
const HeroHeader: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 10);
  });

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  const dropdownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    user, 
    profile, 
    isSessionLoading, // This is true until AuthSessionProvider's initial check is done
    sessionError,
    // isLoadingAuth is not used here directly, as isSessionLoading is more relevant for initial skeleton display
  } = useAuth();

  // Corrected condition for showing skeletons:
  // Show skeletons if not mounted (initial client render) OR if the session is actively being loaded.
  const showSkeletons = !mounted || isSessionLoading;

  // Determine authentication status once loading is complete and component is mounted.
  const currentIsAuthenticated = mounted && !!user && !sessionError;

  const handleDropdownEnter = (label: string) => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
    }
    setOpenDropdown(label);
  };

  const handleDropdownLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setOpenDropdown(null);
    }, 100);
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

  const getDisplayName = () => {
    if (profile?.firstName) return profile.firstName;
    const userMetaFirstName = user?.user_metadata?.first_name as string | undefined;
    if (userMetaFirstName) return userMetaFirstName;
    if (user?.email) return user.email.split('@')[0];
    return 'User';
  };

  const getInitials = () => {
    const firstName = profile?.firstName || (user?.user_metadata?.first_name as string | undefined);
    const lastName = profile?.lastName || (user?.user_metadata?.last_name as string | undefined);
    const firstInitial = firstName?.[0] || '';
    const lastInitial = lastName?.[0] || '';
    const initials = `${firstInitial}${lastInitial}`.toUpperCase();
    return initials || <UserCircle2 size={18} />;
  };
  
  const avatarUrl = profile?.avatarUrl || (user?.user_metadata?.avatar_url as string | undefined);

  return (
    <motion.header
      ref={headerRef}
      variants={headerVariants}
      initial="top"
      animate={isScrolled ? 'scrolled' : 'top'}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="px-6 w-full md:px-10 lg:px-16 fixed top-0 left-0 right-0 z-30 backdrop-blur-md border-b"
    >
      <div className="container mx-auto px-0 sm:px-0 lg:px-0">
        <nav className="flex justify-between items-center max-w-screen-xl mx-auto h-[70px]">
          <Link href="/" className="flex items-center flex-shrink-0 group">
            <PassForgeLogo className="h-8 w-8 text-primary group-hover:text-primary transition-colors" />
            <span className="text-xl font-bold ml-2 text-foreground group-hover:text-primary transition-colors">
              {LOGO_TEXT}
            </span>
          </Link>

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

          <div className="hidden md:flex items-center flex-shrink-0 space-x-2 sm:space-x-4 lg:space-x-6">
            {showSkeletons ? (
              <>
                <Skeleton className="h-8 w-20" /> 
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </>
            ) : currentIsAuthenticated ? (
              <>
                <span className="text-sm text-foreground hidden sm:inline">
                  Hi, {getDisplayName()}
                </span>
                <Avatar className="h-8 w-8 text-sm">
                  {avatarUrl && <AvatarImage src={avatarUrl} alt={getDisplayName()} />}
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <form action={signOutUserAction}>
                  <Button variant="ghost" type="submit" size="sm">Sign Out</Button>
                </form>
                <Button variant="secondary" asChild size="sm">
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild size="sm">
                  <Link href="/login">Login</Link>
                </Button>
                <Button variant="default" asChild size="sm">
                  <Link href="/register">Register</Link>
                </Button>
              </>
            )}
          </div>

          <div className="md:hidden flex items-center">
            <motion.button
              onClick={toggleMobileMenu}
              className="text-muted-foreground hover:text-foreground z-50 p-2 -mr-2"
              aria-label="Toggle menu"
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            >
              {isMobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
            </motion.button>
          </div>
        </nav>
      </div>
      <MobileMenu
        isOpen={isMobileMenuOpen}
        items={NAV_ITEMS_MOBILE}
        onClose={toggleMobileMenu}
        isSessionLoading={showSkeletons} // Pass the comprehensive loading state
        isAuthenticated={currentIsAuthenticated} // Pass the derived authenticated state
      />
    </motion.header>
  );
};

export default HeroHeader;
