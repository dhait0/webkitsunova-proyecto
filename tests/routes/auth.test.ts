import request from 'supertest';
import app from '../src/server/app';

vi.mock('../../src/server/lib/supabase', () => ({
  supabaseAdmin: {
    auth: {
      signInWithPassword: vi.fn(),
      signInWithOAuth: vi.fn(),
      getUser: vi.fn(),
      admin: {
        signOut: vi.fn(),
        createUser: vi.fn(),
        updateUserById: vi.fn(),
        mfa: {
          deleteFactor: vi.fn(),
        },
      },
    },
  },
}));

import { supabaseAdmin } from '../src/server/lib/supabase';

const mockSignIn = vi.mocked(supabaseAdmin.auth.signInWithPassword);
const mockSignInOAuth = vi.mocked(supabaseAdmin.auth.signInWithOAuth);
const mockSignOut = vi.mocked(supabaseAdmin.auth.admin.signOut);
const mockGetUser = vi.mocked(supabaseAdmin.auth.getUser);
const mockCreateUser = vi.mocked(supabaseAdmin.auth.admin.createUser);
const mockUpdateUser = vi.mocked(supabaseAdmin.auth.admin.updateUserById);
const mockDeleteFactor = vi.mocked(supabaseAdmin.auth.admin.mfa.deleteFactor);

describe('Auth routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('registers a new user and returns 201', async () => {
      mockCreateUser.mockResolvedValueOnce({
        data: { user: { id: 'user-123', email: 'new@example.com' } },
        error: null,
      });
      mockUpdateUser.mockResolvedValueOnce({});

      const res = await request(app).post('/api/auth/register').send({
        email: 'new@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        username: 'testuser',
      });

      expect(res.status).toBe(201);
      expect(res.body).toEqual({
        success: true,
        user: {
          id: 'user-123',
          email: 'new@example.com',
          role: 'USER',
        },
      });
      expect(mockCreateUser).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'password123',
        user_metadata: {
          first_name: 'Test',
          last_name: 'User',
          username: 'testuser',
        },
      });
      expect(mockUpdateUser).toHaveBeenCalledWith('user-123', {
        app_metadata: { role: 'USER' },
      });
    });

    it('returns 409 when user already exists', async () => {
      mockCreateUser.mockResolvedValueOnce({
        data: null,
        error: { message: 'User already registered' },
      });

      const res = await request(app).post('/api/auth/register').send({
        email: 'existing@example.com',
        password: 'password123',
      });

      expect(res.status).toBe(409);
      expect(res.body).toEqual({
        success: false,
        message: 'Ya existe una cuenta con ese correo',
      });
    });

    it('returns 400 when Supabase returns a non-duplicate error', async () => {
      mockCreateUser.mockResolvedValueOnce({
        data: null,
        error: { message: 'Invalid email format' },
      });

      const res = await request(app).post('/api/auth/register').send({
        email: 'new@example.com',
        password: 'password123',
      });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        success: false,
        message: 'Invalid email format',
      });
    });

    it('returns 400 for invalid email format', async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: 'not-an-email',
        password: 'password123',
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Datos inválidos');
      expect(res.body.issues).toBeDefined();
    });

    it('returns 400 when password is too short', async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: 'test@example.com',
        password: 'short',
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Datos inválidos');
    });
  });

  describe('POST /api/auth/login', () => {
    it('logs in and returns session and user on success', async () => {
      mockSignIn.mockResolvedValueOnce({
        data: {
          session: {
            access_token: 'access-token',
            refresh_token: 'refresh-token',
            expires_at: 1234567890,
          },
          user: {
            id: 'user-123',
            email: 'test@example.com',
            app_metadata: { role: 'USER' },
            user_metadata: { first_name: 'Test' },
            factors: [],
          },
        },
        error: null,
      });

      const res = await request(app).post('/api/auth/login').send({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        success: true,
        session: {
          access_token: 'access-token',
          refresh_token: 'refresh-token',
          expires_at: 1234567890,
        },
        user: {
          id: 'user-123',
          email: 'test@example.com',
          role: 'USER',
          profile: { first_name: 'Test' },
          factors: [],
        },
      });
    });

    it('returns 401 when credentials are invalid', async () => {
      mockSignIn.mockResolvedValueOnce({
        data: null,
        error: { message: 'Invalid credentials' },
      });

      const res = await request(app).post('/api/auth/login').send({
        email: 'test@example.com',
        password: 'wrongpassword',
      });

      expect(res.status).toBe(401);
      expect(res.body).toEqual({
        success: false,
        message: 'Credenciales inválidas',
      });
    });

    it('returns 401 with requiresMfa when MFA is required', async () => {
      mockSignIn.mockResolvedValueOnce({
        data: null,
        error: { message: 'Multi-factor authentication is required' },
      });

      const res = await request(app).post('/api/auth/login').send({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(res.status).toBe(401);
      expect(res.body).toEqual({
        success: false,
        message: 'Se requiere verificación de dos factores',
        requiresMfa: true,
      });
    });

    it('returns 400 for invalid email format', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'not-an-email',
        password: 'password123',
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Datos inválidos');
    });

    it('returns 400 when password is empty', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'test@example.com',
        password: '',
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Datos inválidos');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('returns success when token is provided and Supabase succeeds', async () => {
      mockSignOut.mockResolvedValueOnce({});

      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        success: true,
        message: 'Sesión cerrada',
      });
      expect(mockSignOut).toHaveBeenCalledWith('valid-token');
    });

    it('returns success when no token is provided', async () => {
      const res = await request(app).post('/api/auth/logout');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        success: true,
        message: 'Sesión cerrada',
      });
      expect(mockSignOut).not.toHaveBeenCalled();
    });

    it('returns success even when Supabase signOut throws', async () => {
      mockSignOut.mockRejectedValueOnce(new Error('Network error'));

      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        success: true,
        message: 'Sesión cerrada',
      });
    });
  });

  describe('GET /api/auth/google', () => {
    it('returns OAuth URL on success', async () => {
      mockSignInOAuth.mockResolvedValueOnce({
        data: { url: 'https://accounts.google.com/oauth/authorize' },
        error: null,
      });

      const res = await request(app).get('/api/auth/google');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        success: true,
        url: 'https://accounts.google.com/oauth/authorize',
      });
    });

    it('returns 400 when Supabase returns an error', async () => {
      mockSignInOAuth.mockResolvedValueOnce({
        data: null,
        error: { message: 'OAuth provider not configured' },
      });

      const res = await request(app).get('/api/auth/google');

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        success: false,
        message: 'OAuth provider not configured',
      });
    });
  });

  describe('GET /api/auth/me (protected)', () => {
    it('returns 401 without authorization header', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body).toEqual({
        success: false,
        message: 'No hay sesión activa',
      });
    });

    it('returns user info when authenticated', async () => {
      mockGetUser.mockResolvedValueOnce({
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
            app_metadata: { role: 'PSYCHOLOGIST' },
          },
        },
        error: null,
      });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        success: true,
        user: {
          id: 'user-123',
          email: 'test@example.com',
          role: 'PSYCHOLOGIST',
        },
      });
    });

    it('returns 401 when token is invalid', async () => {
      mockGetUser.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Invalid token' },
      });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/auth/admin/check (protected, admin role)', () => {
    it('returns 401 without authorization', async () => {
      const res = await request(app).get('/api/auth/admin/check');

      expect(res.status).toBe(401);
    });

    it('returns 403 when user is not admin', async () => {
       mockGetUser.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
            app_metadata: { role: 'USER' },
          },
        },
        error: null,
      });

      const res = await request(app)
        .get('/api/auth/admin/check')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(403);
      expect(res.body).toEqual({
        success: false,
        message: 'Requiere rol: ADMIN',
      });
    });

    it('returns 200 when user is admin', async () => {
       mockGetUser.mockResolvedValue({
        data: {
          user: {
            id: 'admin-123',
            email: 'admin@example.com',
            app_metadata: { role: 'ADMIN' },
          },
        },
        error: null,
      });

      const res = await request(app)
        .get('/api/auth/admin/check')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        success: true,
        message: 'Acceso de administrador verificado',
      });
    });
  });

  describe('GET /api/auth/mfa/status (protected)', () => {
    it('returns 401 without authorization', async () => {
      const res = await request(app).get('/api/auth/mfa/status');

      expect(res.status).toBe(401);
    });

    it('returns mfaEnabled: false when no TOTP factor exists', async () => {
       mockGetUser.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            factors: [],
          },
        },
        error: null,
      });

      const res = await request(app)
        .get('/api/auth/mfa/status')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        success: true,
        mfaEnabled: false,
        mfaType: null,
        factorId: null,
      });
    });

    it('returns mfaEnabled: true when TOTP factor exists', async () => {
       mockGetUser.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            factors: [
              {
                id: 'factor-123',
                factor_type: 'totp',
                friendly_name: 'Authenticator',
              },
            ],
          },
        },
        error: null,
      });

      const res = await request(app)
        .get('/api/auth/mfa/status')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        success: true,
        mfaEnabled: true,
        mfaType: 'totp',
        factorId: 'factor-123',
      });
    });

     it('returns 404 when user is not found', async () => {
       mockGetUser
         .mockResolvedValueOnce({
           data: {
             user: {
               id: 'user-123',
               email: 'test@example.com',
             },
           },
           error: null,
         })
         .mockResolvedValueOnce({
           data: { user: null },
           error: { message: 'User not found' },
         });

      const res = await request(app)
        .get('/api/auth/mfa/status')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        success: false,
        message: 'Usuario no encontrado',
      });
    });
  });

  describe('POST /api/auth/mfa/unenroll (protected)', () => {
    it('returns 401 without authorization', async () => {
      const res = await request(app).post('/api/auth/mfa/unenroll').send({
        factorId: 'factor-123',
      });

      expect(res.status).toBe(401);
    });

    it('returns 400 for invalid body (missing factorId)', async () => {
      mockGetUser.mockResolvedValueOnce({
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
            app_metadata: { role: 'USER' },
          },
        },
        error: null,
      });

      const res = await request(app)
        .post('/api/auth/mfa/unenroll')
        .set('Authorization', 'Bearer valid-token')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Datos inválidos');
    });

    it('unenrolls factor and returns success', async () => {
      mockGetUser.mockResolvedValueOnce({
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
            app_metadata: { role: 'USER' },
          },
        },
        error: null,
      });

      mockDeleteFactor.mockResolvedValueOnce({
        data: { id: 'factor-123' },
        error: null,
      });

      const res = await request(app)
        .post('/api/auth/mfa/unenroll')
        .set('Authorization', 'Bearer valid-token')
        .send({ factorId: 'factor-123' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        success: true,
        factorId: 'factor-123',
      });
      expect(mockDeleteFactor).toHaveBeenCalledWith({
        userId: 'user-123',
        id: 'factor-123',
      });
    });

    it('returns 400 when Supabase returns an error', async () => {
      mockGetUser.mockResolvedValueOnce({
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
            app_metadata: { role: 'USER' },
          },
        },
        error: null,
      });

      mockDeleteFactor.mockResolvedValueOnce({
        data: null,
        error: { message: 'Factor not found' },
      });

      const res = await request(app)
        .post('/api/auth/mfa/unenroll')
        .set('Authorization', 'Bearer valid-token')
        .send({ factorId: 'factor-123' });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        success: false,
        message: 'Factor not found',
      });
    });
  });
});
