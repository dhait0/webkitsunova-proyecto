import { vi } from 'vitest';

vi.mock('@supabase/supabase-js', () => {
  const mockAuth = {
    getUser: vi.fn(),
    getSession: vi.fn(),
    signInWithPassword: vi.fn(),
    signInWithOAuth: vi.fn(),
    refreshSession: vi.fn(),
    updateUser: vi.fn(),
    signOut: vi.fn(),
    on: vi.fn(),
    mfa: {
      getAuthenticatorAssuranceLevel: vi.fn(),
      enroll: vi.fn(),
      challenge: vi.fn(),
      verify: vi.fn(),
      unenroll: vi.fn(),
    },
    admin: {
      getUser: vi.fn(),
      signOut: vi.fn(),
      createUser: vi.fn(),
      updateUserById: vi.fn(),
      deleteUser: vi.fn(),
      listUsers: vi.fn(),
      mfa: {
        deleteFactor: vi.fn(),
        listFactors: vi.fn(),
      },
      auth: {
        signOut: vi.fn(),
        getUser: vi.fn(),
      },
    },
  };

  return {
    createClient: vi.fn(() => ({
      auth: mockAuth,
      from: vi.fn(),
      rpc: vi.fn(),
    })),
  };
});

process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SECRET_KEY = 'test-secret-key';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.NODE_ENV = 'test';
process.env.CORS_ORIGIN = 'http://localhost:5174';
process.env.FRONTEND_URL = 'http://localhost:5174';
