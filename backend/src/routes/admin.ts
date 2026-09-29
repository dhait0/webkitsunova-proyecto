import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { z } from 'zod';

const adminRouter = Router();

const updateUserStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED']),
  suspendedReason: z.string().optional(),
});

adminRouter.use(requireAuth);
adminRouter.use(requireRole('ADMIN'));

adminRouter.get('/stats/users', async (req, res, next) => {
  try {
    const [total, active, suspended, pending] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'ACTIVE', role: 'USER' } }),
      prisma.user.count({ where: { status: 'SUSPENDED', role: 'USER' } }),
      prisma.user.count({ where: { status: 'PENDING', role: 'USER' } }),
    ]);

    return res.json({
      success: true,
      stats: {
        total,
        active,
        suspended,
        pending,
      },
    });
  } catch (error) {
    return next(error);
  }
});

adminRouter.get('/stats/psychologists', async (req, res, next) => {
  try {
    const [total, approved, pending, suspended] = await Promise.all([
      prisma.psychologistProfile.count(),
      prisma.psychologistProfile.count({ where: { isApproved: true } }),
      prisma.psychologistProfile.count({ where: { isApproved: false } }),
      prisma.user.count({ where: { role: 'PSYCHOLOGIST', status: 'SUSPENDED' } }),
    ]);

    return res.json({
      success: true,
      stats: {
        total,
        approved,
        pending,
        suspended,
      },
    });
  } catch (error) {
    return next(error);
  }
});

adminRouter.get('/users', async (req, res, next) => {
  try {
    const search = req.query.search as string | undefined;
    const status = req.query.status as string | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const where: {
      role: 'USER';
      OR?: Array<{ email: { contains: string; mode: 'insensitive' } } | { profile: { username: { contains: string; mode: 'insensitive' } } } | { profile: { firstName: { contains: string; mode: 'insensitive' } } }>;
      status?: 'ACTIVE' | 'SUSPENDED';
    } = {
      role: 'USER',
    };

    if (status && ['ACTIVE', 'SUSPENDED'].includes(status)) {
      where.status = status as 'ACTIVE' | 'SUSPENDED';
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { profile: { username: { contains: search, mode: 'insensitive' } } },
        { profile: { firstName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { profile: true },
      }),
      prisma.user.count({ where }),
    ]);

    const mappedUsers = users.map((user) => ({
      id: user.id,
      email: user.email,
      firstName: user.profile?.firstName ?? null,
      lastName: user.profile?.lastName ?? null,
      username: user.profile?.username ?? null,
      status: user.status,
      twoFactorEnabled: user.twoFactorEnabled,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    }));

    return res.json({
      success: true,
      users: mappedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return next(error);
  }
});

adminRouter.get('/psychologists', async (req, res, next) => {
  try {
    const search = req.query.search as string | undefined;
    const statusFilter = req.query.status as string | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const psychologists = await prisma.user.findMany({
      where: { role: 'PSYCHOLOGIST' },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        profile: {
          include: { psychologistProfile: true },
        },
      },
    });

    const total = await prisma.user.count({ where: { role: 'PSYCHOLOGIST' } });

    const mappedPsychologists = psychologists.map((psy) => {
      const profile = psy.profile;
      const psychProfile = profile?.psychologistProfile;
      const isApproved = psychProfile?.isApproved ?? false;

      let status: string;
      if (psy.status === 'SUSPENDED') {
        status = 'suspendido';
      } else if (isApproved) {
        status = 'activo';
      } else {
        status = 'revision';
      }

      return {
        id: psy.id,
        email: psy.email,
        name: `${profile?.firstName ?? ''} ${profile?.lastName ?? ''}`.trim(),
        specialty: (psychProfile?.specialties ?? [])[0] ?? '',
        specialties: psychProfile?.specialties ?? [],
        status,
        verified: isApproved,
        patients: psychProfile?.patientsCount ?? 0,
        rating: psychProfile?.rating ?? 0,
        reviews: psychProfile?.reviewsCount ?? 0,
        sessionPrice: psychProfile?.sessionPrice ?? null,
        country: profile?.country ?? '',
        phone: profile?.phone ?? '',
        bio: profile?.bio ?? '',
        createdAt: psy.createdAt.toISOString(),
        updatedAt: psy.updatedAt.toISOString(),
      };
    });

    const filtered = mappedPsychologists.filter((psy) => {
      if (statusFilter) {
        if (statusFilter === 'active' && psy.status !== 'activo') return false;
        if (statusFilter === 'revision' && psy.status !== 'revision') return false;
        if (statusFilter === 'suspendido' && psy.status !== 'suspendido') return false;
      }

      if (search) {
        const searchLower = search.toLowerCase();
        const matches =
          psy.email.toLowerCase().includes(searchLower) ||
          psy.name.toLowerCase().includes(searchLower) ||
          psy.specialty.toLowerCase().includes(searchLower);
        if (!matches) return false;
      }

      return true;
    });

    return res.json({
      success: true,
      psychologists: filtered,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return next(error);
  }
});

adminRouter.patch('/users/:id/status', async (req, res, next) => {
  try {
    const { id } = req.params;
    const payload = updateUserStatusSchema.parse(req.body);

    await prisma.user.update({
      where: { id },
      data: {
        status: payload.status,
        updatedAt: new Date(),
      },
    });

    return res.json({
      success: true,
      message: `Estado actualizado a ${payload.status === 'ACTIVE' ? 'Activo' : 'Suspendido'}`,
    });
  } catch (error) {
    return next(error);
  }
});

adminRouter.patch('/psychologists/:id/approve', async (req, res, next) => {
  try {
    const { id } = req.params;

    const profile = await prisma.profile.findUnique({
      where: { userId: id },
      select: { id: true },
    });

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Perfil no encontrado' });
    }

    await prisma.psychologistProfile.update({
      where: { profileId: profile.id },
      data: { isApproved: true },
    });

    return res.json({
      success: true,
      message: 'Psicólogo aprobado correctamente',
    });
  } catch (error) {
    return next(error);
  }
});

adminRouter.delete('/users/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.user.delete({
      where: { id },
    });

    return res.json({
      success: true,
      message: 'Usuario eliminado correctamente',
    });
  } catch (error) {
    return next(error);
  }
});

export default adminRouter;
