import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getRole, toAppRole, homeForRole, availableViews, sessionUserFromSupabaseUser } from '@/lib/auth/roles';

describe('getRole', () => {
  it('reads the role from app_metadata', () => {
    expect(getRole({ app_metadata: { role: 'ADMIN' } })).toBe('ADMIN');
  });

  // Regression: `user.role` holds Supabase's own auth role ('authenticated',
  // 'anon') and must never grant an area.
  it('falls back to USER when app_metadata has no role', () => {
    expect(getRole({ app_metadata: {} })).toBe('USER');
  });

  it('falls back to USER for an unknown role value', () => {
    expect(getRole({ app_metadata: { role: 'superadmin' } })).toBe('USER');
  });

  it('is case sensitive, so a lowercase role grants nothing', () => {
    expect(getRole({ app_metadata: { role: 'admin' } })).toBe('USER');
  });
});

describe('toAppRole', () => {
  it('passes through the three known roles', () => {
    expect(toAppRole('USER')).toBe('USER');
    expect(toAppRole('PSYCHOLOGIST')).toBe('PSYCHOLOGIST');
    expect(toAppRole('ADMIN')).toBe('ADMIN');
  });

  it('defaults anything else, including null, to USER', () => {
    expect(toAppRole(null)).toBe('USER');
    expect(toAppRole(undefined)).toBe('USER');
    expect(toAppRole('')).toBe('USER');
  });
});

describe('homeForRole', () => {
  it('maps each role to its own area', () => {
    expect(homeForRole('ADMIN')).toBe('/admin');
    expect(homeForRole('PSYCHOLOGIST')).toBe('/psy');
    expect(homeForRole('USER')).toBe('/dashboard');
  });

  it('sends an unrecognised role to the user area rather than an admin one', () => {
    expect(homeForRole('root')).toBe('/dashboard');
  });
});

describe('availableViews', () => {
  it('gives a plain user nothing to switch to', () => {
    expect(availableViews('USER')).toEqual([]);
  });

  it('lets an administrator inspect every area', () => {
    expect(availableViews('ADMIN').map((view) => view.to)).toEqual([
      '/admin',
      '/psy',
      '/dashboard',
    ]);
  });

  it('lets a psychologist reach the user area but not admin', () => {
    expect(availableViews('PSYCHOLOGIST').map((view) => view.to)).toEqual([
      '/psy',
      '/dashboard',
    ]);
  });
});

describe('sessionUserFromSupabaseUser', () => {
  it('maps a Supabase user into a session user', () => {
    expect(
      sessionUserFromSupabaseUser({
        id: 'user-1',
        email: 'ada@example.com',
        app_metadata: { role: 'PSYCHOLOGIST' },
        user_metadata: { first_name: 'Ada', last_name: 'Lovelace', username: 'ada' },
      }, 'ACTIVE')
    ).toEqual({
      id: 'user-1',
      email: 'ada@example.com',
      role: 'PSYCHOLOGIST',
      status: 'ACTIVE',
      profile: { firstName: 'Ada', lastName: 'Lovelace', username: 'ada' },
    });
  });

  it('returns null without a user', () => {
    expect(sessionUserFromSupabaseUser(null)).toBeNull();
    expect(sessionUserFromSupabaseUser(undefined)).toBeNull();
  });

  it('tolerates a missing email and metadata', () => {
    const session = sessionUserFromSupabaseUser({ id: 'user-2' }, 'ACTIVE');

    expect(session).toEqual({
      id: 'user-2',
      email: '',
      role: 'USER',
      status: 'ACTIVE',
      profile: { firstName: null, lastName: null, username: null },
    });
  });

  it('acepta un estado de cuenta personalizado', () => {
    const session = sessionUserFromSupabaseUser(
      { id: 'user-3', email: 'pend@example.com', app_metadata: { role: 'USER' } },
      'PENDING'
    );

    expect(session?.status).toBe('PENDING');
    expect(session?.role).toBe('USER');
  });
});
