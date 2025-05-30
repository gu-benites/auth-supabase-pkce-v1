"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DropdownItem from './dropdown-item';
import { DropdownItemData } from '../../types';
import { ExternalLinkIcon } from './icons'; // For providing the icon to items

interface DropdownMenuProps {
  items: DropdownItemData[];
  isOpen: boolean;
  onClose?: () => void; // Optional: if items handle close via onClick
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({ items, isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95, transition: { duration: 0.15 } }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-56 origin-top z-40 bg-background border border-border/50 rounded-md shadow-xl p-2"
        >
            <div className="bg-background border border-border/50 rounded-md shadow-xl p-2">
                {items.map((item) => (
                <DropdownItem
                    key={item.label}
                    label={item.label}
                    href={item.href}
                    // Example of how an icon could be passed. Original bckup code didn't show how icon prop was populated.
                    // We'll make 'Blog' have the ExternalLinkIcon as per original bckup code.
                    icon={item.label === 'Blog' ? <ExternalLinkIcon /> : item.icon}
                    onClick={onClose} // Close dropdown when an item is clicked
                />
                ))}
            </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DropdownMenu;