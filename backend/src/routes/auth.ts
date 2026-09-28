import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { z } from 'zod';

const authRouter = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  username: z.string().min(3).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const mfaUnenrollSchema = z.object({
  factorId: z.string().min(1),
});

authRouter.post('/register', async (req, res, next) => {
  try {
    const payload = registerSchema.parse(req.body);

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: payload.email,
      password: payload.password,
      user_metadata: {
        first_name: payload.firstName ?? null,
        last_name: payload.lastName ?? null,
        username: payload.username ?? null,
      },
    });

    if (error) {
      const msg = error.message ?? 'Error desconocido';
      if (msg.includes('already registered') || msg.includes('duplicate')) {
        return res.status(409).json({
          success: false,
          message: 'Ya existe una cuenta con ese correo',
        });
      }
      return res.status(400).json({ success: false, message: msg });
    }

    const userId = data.user?.id ?? '';

    await supabaseAdmin.auth.admin.updateUserById(userId, {
      app_metadata: { role: 'USER' },
    });

    return res.status(201).json({
      success: true,
      user: {
        id: data.user?.id ?? '',
        email: data.user?.email ?? '',
        role: 'USER',
      },
    });
  } catch (error) {
    return next(error);
  }
});

authRouter.post('/login', async (req, res, next) => {
  try {
    const payload = loginSchema.parse(req.body);

    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email: payload.email,
      password: payload.password,
    });

    if (error || !data.session) {
      const mfaError = error?.message ?? '';
      if (mfaError.toLowerCase().includes('mfa') || mfaError.toLowerCase().includes('factor')) {
        return res.status(401).json({
          success: false,
          message: 'Se requiere verificación de dos factores',
          requiresMfa: true,
        });
      }
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }

    const user = data.user;

    return res.json({
      success: true,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      },
      user: {
        id: user.id,
        email: user.email ?? '',
        role: user.app_metadata?.role ?? 'USER',
        profile: user.user_metadata as Record<string, unknown> | null,
        factors: user.factors ?? [],
      },
    });
  } catch (error) {
    return next(error);
  }
});

authRouter.post('/logout', async (req, res, next) => {
  try {
    const token = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice(7)
      : undefined;

    if (token) {
      await supabaseAdmin.auth.admin.signOut(token);
    }

    return res.json({ success: true, message: 'Sesión cerrada' });
  } catch (error) {
    return res.json({ success: true, message: 'Sesión cerrada' });
  }
});

authRouter.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = req.user!;
    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role ?? 'USER',
      },
    });
  } catch (error) {
    return next(error);
  }
});

authRouter.get('/admin/check', requireAuth, requireRole('ADMIN'), async (req, res) => {
  return res.json({ success: true, message: 'Acceso de administrador verificado' });
});

authRouter.get('/mfa/status', requireAuth, async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin.auth.getUser(req.user!.id);

    if (error || !data.user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    const factors = data.user.factors ?? [];
    const totpFactor = factors.find((f) => f.factor_type === 'totp');

    return res.json({
      success: true,
      mfaEnabled: !!totpFactor,
      mfaType: totpFactor?.factor_type ?? null,
      factorId: totpFactor?.id ?? null,
    });
  } catch (error) {
    return next(error);
  }
});

authRouter.post('/mfa/unenroll', requireAuth, async (req, res, next) => {
  try {
    const payload = mfaUnenrollSchema.parse(req.body);

    const { data, error } = await supabaseAdmin.auth.admin.mfa.deleteFactor({
      userId: req.user!.id,
      id: payload.factorId,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message ?? 'Error al desactivar MFA',
      });
    }

    return res.json({ success: true, factorId: data?.id ?? null });
  } catch (error) {
    return next(error);
  }
});

authRouter.get('/google', async (_req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.FRONTEND_URL ?? 'http://localhost:5174'}/dashboard`,
      },
    });

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    if (data?.url) {
      return res.json({ success: true, url: data.url });
    }

    return res.json({ success: true, url: data?.url ?? null });
  } catch (error) {
    return next(error);
  }
});

export default authRouter;
