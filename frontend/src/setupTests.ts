import '@testing-library/jest-dom';
import { vi } from 'vitest';

vi.mock('@/lib/supabase', () => {
  const mockGetUser = vi.fn();
  const mockGetSession = vi.fn();
  const mockSignInWithPassword = vi.fn();
  const mockSignUp = vi.fn();
  const mockSignInWithOAuth = vi.fn();
  const mockGetAuthenticatorAssuranceLevel = vi.fn();
  const mockSignOut = vi.fn();

  return {
    supabase: {
      auth: {
        getSession: mockGetSession,
        getUser: mockGetUser,
        signInWithPassword: mockSignInWithPassword,
        signUp: mockSignUp,
        signInWithOAuth: mockSignInWithOAuth,
        signOut: mockSignOut,
        mfa: {
          getAuthenticatorAssuranceLevel: mockGetAuthenticatorAssuranceLevel,
          listFactors: vi.fn(),
          unenroll: vi.fn(),
        },
      },
    },
  };
});
