'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { availableViews } from '@/lib/auth/roles';
import type { SessionUser } from '@/lib/auth/types';

type RoleSwitcherProps = {
  session: SessionUser;
};

/**
 * Lets a user move between the areas their role can reach. Rendered next to the
 * role chip in the top bar of every private layout.
 *
 * A plain `USER` has one home and therefore nothing to switch between, so the
 * component returns null instead of a control with a single dead entry.
 */
function RoleSwitcher({ session }: RoleSwitcherProps) {
  const pathname = usePathname();
  const views = availableViews(session.role);

  if (views.length < 2) {
    return null;
  }

  return (
    <nav className="role-switcher" aria-label="Cambiar de vista">
      <span className="role-switcher-label" aria-hidden="true">
        Vista
      </span>
      <ul className="role-switcher-list">
        {views.map((view) => {
          // Every route below /admin, /psy and /dashboard belongs to that area,
          // so the entry stays lit while navigating.
          const isCurrent = pathname === view.to || pathname.startsWith(`${view.to}/`);

          return (
            <li key={view.to}>
              <Link
                href={view.to}
                className="role-switcher-item"
                aria-current={isCurrent ? 'page' : undefined}
              >
                {view.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default RoleSwitcher;
