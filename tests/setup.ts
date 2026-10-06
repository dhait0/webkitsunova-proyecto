import '@testing-library/jest-dom';
import { vi } from 'vitest';

/**
 * Test setup for admin area.
 * Server Components use `@/lib/supabase/server` and are mocked individually
 * where a test needs them.
 */

// Mock next/navigation for tests
vi.mock('next/navigation', () => ({
  usePathname: () => '/admin',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));