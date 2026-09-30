import { NavLink } from 'react-router-dom';
import { availableViews } from '@/lib/roles';
import type { SessionUser } from '@/types/session';

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
        {views.map((view) => (
          <li key={view.to}>
            {/* No `end`: every route below /admin, /psy and /dashboard belongs
                to that area, so the entry must stay lit while navigating. */}
            <NavLink to={view.to} className="role-switcher-item">
              {view.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default RoleSwitcher;
