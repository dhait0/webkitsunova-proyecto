import { supabaseAdmin } from '../../src/lib/supabase';
import { getRole } from '../../src/lib/role';

vi.mock('../../src/lib/supabase', () => ({
  supabaseAdmin: {
    auth: {
      getUser: vi.fn(),
    },
  },
}));

vi.mock('../../src/lib/role', () => ({
  getRole: vi.fn(),
}));

const mockGetUser = vi.mocked(supabaseAdmin.auth.getUser);
const mockGetRole = vi.mocked(getRole);

describe('requireRole middleware', () => {
  const mockNext = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when Supabase getUser fails', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'User not found' },
    });

    const { requireRole } = await import('../../src/middleware/requireRole');

    const req: any = { user: { id: 'user-123', email: 'test@example.com' } };
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

  it('returns 401 when Supabase getUser throws', async () => {
    mockGetUser.mockRejectedValueOnce(new Error('Network error'));

    const { requireRole } = await import('../../src/middleware/requireRole');

    const req: any = { user: { id: 'user-123', email: 'test@example.com' } };
    const res: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const middleware = requireRole('ADMIN');
    await middleware(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('returns 403 when user role is not in allowed roles', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: {
        user: { id: 'user-123', email: 'test@example.com' },
      },
      error: null,
    });
    mockGetRole.mockReturnValue('USER');

    const { requireRole } = await import('../../src/middleware/requireRole');

    const req: any = { user: { id: 'user-123', email: 'test@example.com' } };
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
    mockGetUser.mockResolvedValueOnce({
      data: {
        user: { id: 'user-123', email: 'admin@example.com' },
      },
      error: null,
    });
    mockGetRole.mockReturnValue('ADMIN');

    const { requireRole } = await import('../../src/middleware/requireRole');

    const req: any = { user: { id: 'user-123', email: 'admin@example.com' } };
    const res: any = {};

    const middleware = requireRole('ADMIN');
    await middleware(req, res, mockNext);

    expect(req.user).toEqual({
      id: 'user-123',
      email: 'admin@example.com',
      role: 'ADMIN',
    });
    expect(mockNext).toHaveBeenCalled();
  });

  it('allows access when one of multiple roles matches', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: {
        user: { id: 'user-123', email: 'psy@example.com' },
      },
      error: null,
    });
    mockGetRole.mockReturnValue('PSYCHOLOGIST');

    const { requireRole } = await import('../../src/middleware/requireRole');

    const req: any = { user: { id: 'user-123', email: 'psy@example.com' } };
    const res: any = {};

    const middleware = requireRole('ADMIN', 'PSYCHOLOGIST');
    await middleware(req, res, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });
});
