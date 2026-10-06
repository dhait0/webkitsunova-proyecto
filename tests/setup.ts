import '@testing-library/jest-dom';
import { vi } from 'vitest';

/**
 * The browser Supabase client is created per call, so the module itself is
 * mocked rather than a singleton. Every mock must be hoisted out of the
 * `createClient` body: a `vi.fn()` declared inside it would hand out fresh
 * spies on each call and no test could ever assert on a call the component made.
 *
 * Server Components use `@/lib/supabase/server` and are mocked individually
 * where a test needs them.
 */
vi.mock('@/lib/supabase/browser', () => {
  const getUser = vi.fn();
  const getSession = vi.fn();
  const signInWithPassword = vi.fn();
  const signUp = vi.fn();
  const signInWithOAuth = vi.fn();
  const signOut = vi.fn();
  const getAuthenticatorAssuranceLevel = vi.fn();
  const listFactors = vi.fn();
  const unenroll = vi.fn();
  const enroll = vi.fn();
  const challengeAndVerify = vi.fn();
  const resetPasswordForEmail = vi.fn();

  return {
    createClient: () => ({
      auth: {
        getUser,
        getSession,
        signInWithPassword,
        signUp,
        signInWithOAuth,
        signOut,
        resetPasswordForEmail,
        mfa: {
          getAuthenticatorAssuranceLevel,
          listFactors,
          unenroll,
          enroll,
          challengeAndVerify,
        },
      },
    }),
  };
});
