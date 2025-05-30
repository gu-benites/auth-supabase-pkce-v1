import { NavItem } from '../types'; // Adjusted import path
// Note: Icons would typically be imported here or passed directly.
// For simplicity, we'll assume DropdownItem component handles icon rendering if provided.

export const NAV_ITEMS_DESKTOP: NavItem[] = [
  { label: 'Product', href: '#product' },
  { label: 'Customers', href: '#customers' },
  {
    label: 'Channels',
    href: '#channels', // Main link for Channels if any, or just a trigger
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
    href: '#resources', // Main link for Resources
    children: [
      // Icon prop will be handled by DropdownItem if it exists in DropdownItemData type
      { label: 'Blog', href: '#blog', icon: /* ExternalLinkIcon would be passed here */ undefined },
      { label: 'Guides', href: '#guides' },
      { label: 'Help Center', href: '#help-center' },
      { label: 'API Reference', href: '#api-reference' },
    ],
  },
  { label: 'Docs', href: '#docs' },
  { label: 'Pricing', href: '#pricing' },
];

export const NAV_ITEMS_MOBILE: NavItem[] = [
  ...NAV_ITEMS_DESKTOP,
  { label: 'Sign in', href: '#signin', isMobileOnly: true },
  // "Book a demo" is already a primary button on desktop, will be rendered as such on mobile too.
];


export const PRIMARY_BUTTON_TEXT = "Book a demo";
export const SECONDARY_BUTTON_TEXT = "Sign in"; // For desktop secondary action if needed

export const LOGO_TEXT = "Nexus";