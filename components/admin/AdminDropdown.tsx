'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from './Icon';
import type { IconName } from './types';

export type DropdownItem = {
  label: string;
  onClick: () => void;
  icon?: IconName;
  variant?: 'default' | 'danger' | 'primary';
  disabled?: boolean;
  className?: string;
};

type AdminDropdownProps = {
  items: DropdownItem[];
  triggerLabel?: string;
  triggerIcon?: IconName;
  triggerClassName?: string;
  align?: 'left' | 'right';
};

export function AdminDropdown({
  items,
  triggerLabel = 'Acciones',
  triggerIcon = 'menu',
  triggerClassName = '',
  align = 'right',
}: AdminDropdownProps) {
  const [open, setOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const clickedTrigger = dropdownRef.current?.contains(target);
      const clickedMenu = menuRef.current?.contains(target);
      if (!clickedTrigger && !clickedMenu) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const menuWidth = 220;
      const left = align === 'right'
        ? rect.right - menuWidth
        : rect.left;
      setMenuPosition({
        top: rect.bottom + 6 + window.scrollY,
        left: left + window.scrollX,
      });
    }
  };

  const handleItemClick = (onClick: () => void) => {
    onClick();
    setOpen(false);
  };

  return (
    <div className="admin-dropdown" ref={dropdownRef}>
      <button
        ref={triggerRef}
        type="button"
        className={`admin-dropdown-trigger admin-btn admin-btn-ghost ${triggerClassName}`}
        onClick={() => handleOpenChange(!open)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={triggerLabel}
      >
        <Icon name={triggerIcon} size={16} />
        {triggerLabel && <span>{triggerLabel}</span>}
        <Icon name={open ? 'chevronLeft' : 'chevronRight'} size={12} className="admin-dropdown-chevron" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            className={`admin-dropdown-menu ${align === 'right' ? 'admin-dropdown-menu-right' : ''}`}
            role="menu"
            style={{
              zIndex: 50,
              position: 'fixed',
              top: menuPosition.top,
              left: menuPosition.left,
            }}
          >
            {items.map((item, index) => (
              <motion.button
                key={index}
                type="button"
                role="menuitem"
                tabIndex={-1}
                onClick={() => handleItemClick(item.onClick)}
                disabled={item.disabled}
                className={`admin-dropdown-item ${item.variant === 'danger' ? 'admin-dropdown-item-danger' : ''} ${item.variant === 'primary' ? 'admin-dropdown-item-primary' : ''} ${item.className || ''}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.1, delay: index * 0.02 }}
                style={{ outline: 'none' }}
              >
                {item.icon && <Icon name={item.icon} size={14} className="admin-dropdown-item-icon" />}
                <span>{item.label}</span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AdminDropdown;