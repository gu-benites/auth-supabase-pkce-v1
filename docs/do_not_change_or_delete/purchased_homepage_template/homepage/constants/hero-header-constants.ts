
import type { NavItem } from '../types'; 

// Navigational items for the main desktop navigation bar
export const NAV_ITEMS_DESKTOP: NavItem[] = [
  { label: 'Product', href: '#product' },
  { label: 'Customers', href: '#customers' },
  {
    label: 'Channels',
    href: '#channels', 
    children: [
      { label: 'Slack', href: '#slack' },
      { label: 'Microsoft Teams', href: '#ms-teams' },
      { label: 'Discord', href: '#discord' },
      { label: 'Email', href: '#email' },
      { label: 'Web Chat', href: '#web-chat' },
    ],
  },
  {
    label: 'Resources',
    href: '#resources', 
    children: [
      { label: 'Blog', href: '#blog', icon: undefined },
      { label: 'Guides', href: '#guides' },
      { label: 'Help Center', href: '#help-center' },
      { label: 'API Reference', href: '#api-reference' },
    ],
  },
  { label: 'Docs', href: '#docs' },
  { label: 'Pricing', href: '#pricing' },
  // "Book a Demo" might be handled separately or as a primary CTA alongside auth buttons.
  // For now, keeping desktop nav items purely navigational. Auth buttons are added in HeroHeader.
];

// Simplified general navigation items for the mobile menu.
// Auth-specific links (Login, Register, Dashboard, Logout) will be added dynamically by MobileMenu.tsx
export const NAV_ITEMS_MOBILE: NavItem[] = [
  { label: 'Product', href: '#product' },
  { label: 'Customers', href: '#customers' },
  {
    label: 'Channels',
    href: '#channels', 
    children: [ // Mobile can still have simple dropdowns
      { label: 'Slack', href: '#slack' },
      { label: 'Microsoft Teams', href: '#ms-teams' },
      { label: 'Discord', href: '#discord' },
      { label: 'Email', href: '#email' },
      { label: 'Web Chat', href: '#web-chat' },
    ],
  },
  {
    label: 'Resources',
    href: '#resources', 
    children: [
      { label: 'Blog', href: '#blog' },
      { label: 'Guides', href: '#guides' },
      { label: 'Help Center', href: '#help-center' },
    ],
  },
  { label: 'Docs', href: '#docs' },
  { label: 'Pricing', href: '#pricing' },
  // Note: "Sign In" / "Register" or "Dashboard" / "Log Out" are handled by MobileMenu component dynamically
];


export const PRIMARY_BUTTON_TEXT = "Book a demo"; // Still used if "Book a Demo" is a separate button
export const LOGO_TEXT = "Nexus";
