import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { clearSessionCookie, setSessionCookie, signSession } from '../lib/session';
import { requireAuth } from '../middleware/auth';

const authRouter = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  username: z.string().min(3).optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

function isPrismaP2002Error(error: unknown): error is { code: string } {
  return typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === 'P2002';
}

authRouter.post('/register', async (req, res, next) => {
  try {
    const payload = registerSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: payload.email } });

    if (existing) {
      return res.status(409).json({ success: false, message: 'Ya existe una cuenta con ese correo' });
    }

    if (payload.username) {
      const existingUsername = await prisma.profile.findUnique({
        where: { username: payload.username }
      });

      if (existingUsername) {
        return res.status(409).json({
          success: false,
          message: 'Ya existe una cuenta con ese nombre de usuario'
        });
      }
    }

    const passwordHash = await bcrypt.hash(payload.password, 12);

    const user = await prisma.user.create({
      data: {
        email: payload.email,
        passwordHash,
        role: 'USER',
        profile: {
          create: {
            firstName: payload.firstName ?? null,
            lastName: payload.lastName ?? null,
            username: payload.username ?? null
          }
        }
      },
      include: { profile: true }
    });

    return res.status(201).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: user.profile
      }
    });
  } catch (error) {
    if (isPrismaP2002Error(error)) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe una cuenta con ese correo o nombre de usuario'
      });
    }

    return next(error);
  }
});

authRouter.post('/login', async (req, res, next) => {
  try {
    const payload = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({
      where: { email: payload.email },
      include: { profile: true }
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }

    const matches = await bcrypt.compare(payload.password, user.passwordHash);

    if (!matches) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }

    const token = signSession({
      sub: user.id,
      email: user.email,
      role: user.role
    });

    setSessionCookie(res, token);

    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: user.profile
      }
    });
  } catch (error) {
    return next(error);
  }
});

authRouter.post('/logout', (_req, res) => {
  clearSessionCookie(res);
  return res.json({ success: true, message: 'Sesión cerrada' });
});

authRouter.get('/me', requireAuth, async (req, res, next) => {
  try {
    const session = req.session!;
    const user = await prisma.user.findUnique({
      where: { id: session.sub },
      include: { profile: true }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        profile: user.profile
      }
    });
  } catch (error) {
    return next(error);
  }
});

export default authRouter;
