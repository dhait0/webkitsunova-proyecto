'use client';

import { createContext, useContext } from 'react';
import type { SessionUser } from '@/lib/auth/types';

/**
 * Replaces React Router's `useOutletContext`.
 *
 * In the App Router a layout receives `children` as a prop instead of rendering
 * an `<Outlet>`, so the value is published through context. The shapes below are
 * unchanged from the old outlet contexts, so pages keep reading the same fields.
 */

export type PsyOutletContext = {
  session: SessionUser;
  displayName: string;
  isApproved: boolean | null;
  loggingOut: boolean;
  logout: () => Promise<void>;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  refreshProfile: () => Promise<void>;
};

const PsyContext = createContext<PsyOutletContext | null>(null);

export const PsyProvider = PsyContext.Provider;

export function usePsy(): PsyOutletContext {
  const value = useContext(PsyContext);

  if (!value) {
    throw new Error(
      'usePsy debe usarse dentro del layout de /psy. Falta PsyProvider en app/psychologist/layout.tsx.'
    );
  }

  return value;
}

export type AdminOutletContext = {
  session: SessionUser;
  displayName: string;
  roleLabel: string;
  loggingOut: boolean;
  logout: () => Promise<void>;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
};

const AdminContext = createContext<AdminOutletContext | null>(null);

export const AdminProvider = AdminContext.Provider;

export function useAdmin(): AdminOutletContext {
  const value = useContext(AdminContext);

  if (!value) {
    throw new Error(
      'useAdmin debe usarse dentro del layout de /admin. Falta AdminProvider en app/admin/layout.tsx.'
    );
  }

  return value;
}
