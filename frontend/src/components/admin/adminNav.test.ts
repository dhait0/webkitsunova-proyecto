import { ADMIN_NAV_SECTIONS, getAdminPageHeading, getAdminPageMeta } from './adminNav';

describe('getAdminPageMeta', () => {
  it('resolves the dashboard route', () => {
    expect(getAdminPageMeta('/admin')).toEqual({ title: 'Inicio', icon: 'home' });
  });

  it('resolves nested admin routes', () => {
    expect(getAdminPageMeta('/admin/users')).toEqual({ title: 'Usuarios', icon: 'user' });
    expect(getAdminPageMeta('/admin/psychologists')).toEqual({
      title: 'Psicólogos',
      icon: 'brain',
    });
  });

  it('resolves sub-routes to their parent section', () => {
    expect(getAdminPageMeta('/admin/users/123').title).toBe('Usuarios');
  });

  it('ignores trailing slashes', () => {
    expect(getAdminPageMeta('/admin/users/').title).toBe('Usuarios');
  });

  it('does not let the dashboard match unknown sub-routes', () => {
    expect(getAdminPageMeta('/admin/inexistente')).toEqual({
      title: 'Panel de administración',
      icon: 'compass',
    });
  });
});

describe('getAdminPageHeading', () => {
  it('returns the heading and subtitle declared in the nav config', () => {
    expect(getAdminPageHeading('/admin')).toEqual({
      heading: 'Panel de control',
      subtitle: 'Resumen de la actividad de la plataforma.',
    });
    expect(getAdminPageHeading('/admin/users').heading).toBe('Usuarios');
  });

  it('falls back to the label when no heading is declared', () => {
    expect(getAdminPageHeading('/admin/inexistente')).toEqual({
      heading: 'Panel de administración',
      subtitle: '',
    });
  });
});

describe('ADMIN_NAV_SECTIONS', () => {
  it('only marks implemented modules as navigable', () => {
    const implemented = ADMIN_NAV_SECTIONS.flatMap((section) =>
      section.items.filter((item) => !item.comingSoon).map((item) => item.to)
    );

    expect(implemented).toEqual(['/admin', '/admin/users', '/admin/psychologists']);
  });

  it('flags every not-yet-built module as coming soon', () => {
    const pending = ADMIN_NAV_SECTIONS.flatMap((section) =>
      section.items.filter((item) => item.comingSoon).map((item) => item.to)
    );

    expect(pending).toEqual([
      '/admin/forum',
      '/admin/messages',
      '/admin/workshops',
      '/admin/resources',
      '/admin/reports',
      '/admin/settings',
    ]);
  });
});
