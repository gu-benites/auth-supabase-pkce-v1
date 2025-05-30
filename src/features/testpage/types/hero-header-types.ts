import type React from 'react';
import type { SVGProps } from 'react';

export interface DropdownItemData {
  label: string;
  href: string;
  icon?: React.ReactElement<SVGProps<SVGSVGElement>>; // Optional icon element
}

export interface NavItem {
  label: string;
  href: string;
  children?: DropdownItemData[]; // Array of dropdown items
  isButton?: boolean; // For CTA like "Book a demo"
  isPrimary?: boolean; // For primary CTA styling
  isMobileOnly?: boolean; // For items like Sign In / Sign Up in mobile that are different from desktop
}