import type { IconName } from './Icon';

export type AdminNavItem = {
  to: string;
  label: string;
  icon: IconName;
  heading?: string;
  subtitle?: string;
  end?: boolean;
  comingSoon?: boolean;
};

export type AdminNavSection = {
  label: string;
  items: AdminNavItem[];
};

export const ADMIN_NAV_SECTIONS: AdminNavSection[] = [
  {
    label: 'General',
    items: [
      {
        to: '/admin',
        label: 'Inicio',
        icon: 'home',
        end: true,
        heading: 'Panel de control',
        subtitle: 'Resumen de la actividad de la plataforma.',
      },
    ],
  },
  {
    label: 'Personas',
    items: [
      {
        to: '/admin/users',
        label: 'Usuarios',
        icon: 'user',
        heading: 'Usuarios',
        subtitle: 'Gestiona los usuarios registrados en la plataforma.',
      },
      {
        to: '/admin/psychologists',
        label: 'Psicólogos',
        icon: 'brain',
        heading: 'Psicólogos',
        subtitle: 'Administra las solicitudes y perfiles de los profesionales.',
      },
    ],
  },
  {
    label: 'Comunidad',
    items: [
      { to: '/admin/forum', label: 'Foro', icon: 'users', comingSoon: true },
      { to: '/admin/messages', label: 'Mensajes', icon: 'message', comingSoon: true },
      { to: '/admin/workshops', label: 'Talleres', icon: 'workshop', comingSoon: true },
      { to: '/admin/resources', label: 'Recursos', icon: 'book', comingSoon: true },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { to: '/admin/reports', label: 'Reportes', icon: 'flag', comingSoon: true },
      { to: '/admin/settings', label: 'Configuración', icon: 'settings', comingSoon: true },
    ],
  },
];

const IMPLEMENTED_ITEMS = ADMIN_NAV_SECTIONS.flatMap((section) =>
  section.items.filter((item) => !item.comingSoon)
);

function findItem(to: string): AdminNavItem | undefined {
  return IMPLEMENTED_ITEMS.find((item) => item.to === to);
}

export function getAdminPageMeta(pathname: string): { title: string; icon: IconName } {
  const normalized = pathname.replace(/\/+$/, '') || '/admin';

  const resolved = IMPLEMENTED_ITEMS.find((item) => {
    if (normalized === item.to) return true;
    if (item.end) return false;
    return normalized.startsWith(`${item.to}/`);
  });

  return resolved
    ? { title: resolved.label, icon: resolved.icon }
    : { title: 'Panel de administración', icon: 'compass' };
}

export function getAdminPageHeading(to: string): { heading: string; subtitle: string } {
  const item = findItem(to);

  if (!item) {
    return { heading: 'Panel de administración', subtitle: '' };
  }

  return { heading: item.heading ?? item.label, subtitle: item.subtitle ?? '' };
}
