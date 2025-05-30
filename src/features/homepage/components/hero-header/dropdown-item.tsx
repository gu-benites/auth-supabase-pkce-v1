"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLinkIcon } from './icons'; // Assuming ExternalLinkIcon is available
import { DropdownItemData } from '../../types';

interface DropdownItemProps extends DropdownItemData {
  onClick?: () => void;
}

const DropdownItem: React.FC<DropdownItemProps> = ({ label, href = "#", icon, onClick }) => {
  // Determine if the provided icon is ExternalLinkIcon to apply specific classes
  // This is a simple check; a more robust way might involve a type or name property on the icon.
  const isExternalLink = icon && (icon.type === ExternalLinkIcon || (typeof icon.type === 'function' && icon.type.name === 'ExternalLinkIcon'));

  return (
    <motion.a
      href={href}
      onClick={onClick}
      className="group flex items-center justify-between w-full px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground rounded-md transition-colors duration-150"
      whileHover={{ x: 2 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <span>{label}</span>
      {icon && React.cloneElement(icon, { 
        className: `w-4 h-4 ml-1 opacity-70 group-hover:opacity-100 transition-opacity ${isExternalLink ? '' : icon.props.className || ''}` 
      })}
    </motion.a>
  );
};

export default DropdownItem;