'use client';

import { createContext, useContext } from 'react';
import type { SessionUser } from '@/lib/auth/types';

/**
 * Replaces React Router's `useOutletContext`.
 *
 * In the App Router a layout receives `children` as a prop rather than
 * rendering an `<Outlet>`, so the value is published through context instead.
 * The shape is identical to the old outlet context, so pages read it the same
 * way: `useOutletContext<DashboardOutletContext>()` becomes `useDashboard()`.
 */
export type DashboardOutletContext = {
  session: SessionUser;
  displayName: string;
  roleLabel: string;
  loggingOut: boolean;
  logout: () => Promise<void>;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
};

const DashboardContext = createContext<DashboardOutletContext | null>(null);

export const DashboardProvider = DashboardContext.Provider;

export function useDashboard(): DashboardOutletContext {
  const value = useContext(DashboardContext);

  if (!value) {
    throw new Error(
      'useDashboard debe usarse dentro de un layout de /dashboard. ' +
        'Falta el DashboardProvider en app/user/layout.tsx.'
    );
  }

  return value;
}
