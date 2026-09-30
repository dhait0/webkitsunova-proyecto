import { vi } from 'vitest';

vi.mock('../../src/lib/supabase', () => ({
  supabaseAdmin: {
    auth: {
      getUser: vi.fn(),
    },
  },
}));

const mockGetUser = vi.mocked(vi.fn());

describe('requireRole middleware', () => {
  const mockNext = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when req.user is not set', async () => {
    const { requireRole } = await import('../../src/middleware/requireRole');

    const req: any = {};
    const res: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const middleware = requireRole('ADMIN');
    await middleware(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Sesión inválida',
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('returns 403 when user role is not in allowed roles', async () => {
    const { requireRole } = await import('../../src/middleware/requireRole');

    const req: any = { user: { id: 'user-123', email: 'test@example.com', role: 'USER' } };
    const res: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const middleware = requireRole('ADMIN', 'PSYCHOLOGIST');
    await middleware(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Requiere rol: ADMIN, PSYCHOLOGIST',
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('calls next() when user has an allowed role', async () => {
    const { requireRole } = await import('../../src/middleware/requireRole');

    const req: any = { user: { id: 'user-123', email: 'admin@example.com', role: 'ADMIN' } };
    const res: any = {};

    const middleware = requireRole('ADMIN');
    await middleware(req, res, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('allows access when one of multiple roles matches', async () => {
    const { requireRole } = await import('../../src/middleware/requireRole');

    const req: any = { user: { id: 'user-123', email: 'psy@example.com', role: 'PSYCHOLOGIST' } };
    const res: any = {};

    const middleware = requireRole('ADMIN', 'PSYCHOLOGIST');
    await middleware(req, res, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });
});
