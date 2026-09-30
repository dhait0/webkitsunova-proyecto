import {
  homeForRole,
  roleFromSupabaseUser,
  sessionUserFromSupabaseUser,
  toAppRole
} from '@/lib/roles';

describe('roles helpers', () => {
  it('maps each role to its home path', () => {
    expect(homeForRole('USER')).toBe('/dashboard');
    expect(homeForRole('PSYCHOLOGIST')).toBe('/psy');
    expect(homeForRole('ADMIN')).toBe('/admin');
  });

  it('falls back to the user home for unknown or missing roles', () => {
    expect(toAppRole('SOMETHING')).toBe('USER');
    expect(toAppRole(undefined)).toBe('USER');
    expect(homeForRole(null)).toBe('/dashboard');
  });

  it('reads the role from app_metadata only, never from user.role', () => {
    const user = {
      app_metadata: { role: 'PSYCHOLOGIST' },
      role: 'authenticated'
    } as unknown as { app_metadata: Record<string, unknown> };

    expect(roleFromSupabaseUser(user)).toBe('PSYCHOLOGIST');
  });

  it('defaults to USER when app_metadata has no role', () => {
    expect(roleFromSupabaseUser({ app_metadata: { role: 42 } })).toBe('USER');
    expect(roleFromSupabaseUser(null)).toBe('USER');
  });

  it('builds a session user from the Supabase user', () => {
    const sessionUser = sessionUserFromSupabaseUser({
      id: 'psy-1',
      email: 'psico@example.com',
      app_metadata: { role: 'PSYCHOLOGIST' },
      user_metadata: { first_name: 'Leidy', last_name: 'Gomez' }
    });

    expect(sessionUser).toEqual({
      id: 'psy-1',
      email: 'psico@example.com',
      role: 'PSYCHOLOGIST',
      status: 'ACTIVE',
      profile: { firstName: 'Leidy', lastName: 'Gomez', username: null }
    });
  });

  it('returns null when there is no user', () => {
    expect(sessionUserFromSupabaseUser(null)).toBeNull();
  });
});
