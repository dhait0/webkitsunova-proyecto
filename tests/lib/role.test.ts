import { getRole } from '../../src/server/lib/role.js';
import type { User } from '@supabase/supabase-js';

describe('getRole', () => {
  it('returns role from app_metadata when present', () => {
    const user = { app_metadata: { role: 'ADMIN' } } as unknown as User;
    expect(getRole(user)).toBe('ADMIN');
  });

  it('returns USER when app_metadata has no role', () => {
    const user = { app_metadata: {} } as unknown as User;
    expect(getRole(user)).toBe('USER');
  });

  it('returns USER when app_metadata is undefined', () => {
    const user = {} as User;
    expect(getRole(user)).toBe('USER');
  });

  it('returns USER when app_metadata.role is not a string', () => {
    const user = { app_metadata: { role: 123 } } as unknown as User;
    expect(getRole(user)).toBe('USER');
  });

  it('returns PSYCHOLOGIST role when set', () => {
    const user = { app_metadata: { role: 'PSYCHOLOGIST' } } as unknown as User;
    expect(getRole(user)).toBe('PSYCHOLOGIST');
  });
});
