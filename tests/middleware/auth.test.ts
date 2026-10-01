import { supabaseAdmin } from '../src/server/lib/supabase';
import { getRole } from '../src/server/lib/role';

vi.mock('../../src/server/lib/supabase', () => ({
  supabaseAdmin: {
    auth: {
      getUser: vi.fn(),
    },
  },
}));

vi.mock('../../src/server/lib/role', () => ({
  getRole: vi.fn(),
}));

const mockGetUser = vi.mocked(supabaseAdmin.auth.getUser);
const mockGetRole = vi.mocked(getRole);

describe('requireAuth middleware', () => {
  const mockNext = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when no authorization header is provided', async () => {
    const { requireAuth } = await import('../../src/middleware/auth');

    const req: any = { headers: {} };
    const res: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await requireAuth(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'No hay sesión activa',
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('returns 401 when authorization header is not Bearer', async () => {
    const { requireAuth } = await import('../../src/middleware/auth');

    const req: any = { headers: { authorization: 'Basic abc123' } };
    const res: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await requireAuth(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('returns 401 when Supabase getUser returns an error', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'Invalid token' },
    });

    const { requireAuth } = await import('../../src/middleware/auth');

    const req: any = { headers: { authorization: 'Bearer invalid-token' } };
    const res: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await requireAuth(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Sesión inválida o expirada',
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('returns 401 when Supabase getUser throws an error', async () => {
    mockGetUser.mockRejectedValueOnce(new Error('Network error'));

    const { requireAuth } = await import('../../src/middleware/auth');

    const req: any = { headers: { authorization: 'Bearer some-token' } };
    const res: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await requireAuth(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('calls next() when token is valid', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: {
        user: {
          id: 'user-123',
          email: 'test@example.com',
        },
      },
      error: null,
    });
    mockGetRole.mockReturnValue('USER');

    const { requireAuth } = await import('../../src/middleware/auth');

    const req: any = { headers: { authorization: 'Bearer valid-token' } };
    const res: any = {};

    await requireAuth(req, res, mockNext);

    expect(req.user).toEqual({
      id: 'user-123',
      email: 'test@example.com',
      role: 'USER',
    });
    expect(mockNext).toHaveBeenCalled();
  });
});
