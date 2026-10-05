'use client';

import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import Icon from './Icon';

type AdminModalProps = {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
};

export function AdminModal({ open, title, children, onClose }: AdminModalProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;

    boxRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onCloseRef.current();
        return;
      }

      if (event.key !== 'Tab' || !boxRef.current) return;

      const focusable = boxRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey) {
        if (document.activeElement === first) {
          event.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="admin-modal active"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={boxRef}
        className="admin-modal-box"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
      >
        <div className="admin-modal-header">
          <h3>{title}</h3>
          <button type="button" className="admin-modal-close" onClick={onClose} aria-label="Cerrar">
            <Icon name="close" size={14} />
          </button>
        </div>

        <div className="admin-modal-body">{children}</div>
      </div>
    </div>
  );
}

export default AdminModal;
