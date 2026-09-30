import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { supabaseAdmin } from '../lib/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { z } from 'zod';

const adminRouter = Router();

const updateUserStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED']),
  suspendedReason: z.string().optional(),
});

const updateUserRoleSchema = z.object({
  role: z.enum(['USER', 'PSYCHOLOGIST', 'ADMIN']),
});

const psyContentStatusSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'PENDING']),
  reason: z.string().max(500).optional(),
});

const verifyPsychologistSchema = z.object({
  verified: z.boolean(),
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

/**
 * Changes a user's application role.
 *
 * The role lives in two places and both must agree:
 *  - `app_metadata.role` in Supabase is the source of truth for authentication
 *    (see agents.md). The frontend and the auth middleware read only this.
 *  - `User.role` in Prisma drives the admin listings, which filter by role.
 *
 * Supabase is updated first: it is the one that decides what the user can do.
 * If the Prisma write then fails the account keeps the new permissions, and the
 * user reappears under the new role once the listing is repaired.
 *
 * An administrator may not change their own role. Allowing it would let the last
 * remaining admin demote themselves and lock the panel out of its own backend.
 */
adminRouter.patch('/users/:id/role', async (req, res, next) => {
  try {
    const { id } = req.params;
    const payload = updateUserRoleSchema.parse(req.body);

    if (id === req.user?.id) {
      return res.status(400).json({
        success: false,
        message: 'No puedes cambiar tu propio rol',
      });
    }

    const { error: supabaseError } = await supabaseAdmin.auth.admin.updateUserById(id, {
      app_metadata: { role: payload.role },
    });

    if (supabaseError) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró el usuario en Supabase Auth',
      });
    }

    await prisma.user.update({
      where: { id },
      data: {
        role: payload.role,
        updatedAt: new Date(),
      },
    });

    return res.json({
      success: true,
      message: `Rol actualizado a ${payload.role}`,
      user: { id, role: payload.role },
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

    const psychologist = await prisma.psychologistProfile.update({
      where: { profileId: profile.id },
      data: { isApproved: true, approvedAt: new Date(), approvedBy: req.user?.id ?? null },
    });

    await prisma.user.update({
      where: { id },
      data: { status: 'ACTIVE' },
    });

    await prisma.notification.create({
      data: {
        userId: id,
        kind: 'account',
        title: 'Perfil profesional aprobado',
        body: 'Tu perfil ya está aprobado y puedes atender pacientes.',
        link: '/psy',
      },
    });

    return res.json({
      success: true,
      message: 'Psicólogo aprobado correctamente',
      psychologist: { id: psychologist.id, isApproved: psychologist.isApproved },
    });
  } catch (error) {
    return next(error);
  }
});

adminRouter.patch('/psychologists/:id/verify', async (req, res, next) => {
  try {
    const { id } = req.params;
    const payload = verifyPsychologistSchema.parse(req.body);

    const profile = await prisma.profile.findUnique({
      where: { userId: id },
      select: { id: true },
    });

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Perfil no encontrado' });
    }

    await prisma.psychologistProfile.update({
      where: { profileId: profile.id },
      data: { isVerified: payload.verified },
    });

    return res.json({
      success: true,
      message: payload.verified ? 'Documentación verificada' : 'Verificación revocada',
    });
  } catch (error) {
    return next(error);
  }
});

adminRouter.get('/psy-content', async (req, res, next) => {
  try {
    const type = req.query.type as string | undefined;
    const status = req.query.status as string | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    if (type === 'resource') {
      const where = {
        ...(status && ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED'].includes(status)
          ? { status: status as 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' }
          : {}),
      };

      const [resources, total] = await Promise.all([
        prisma.resource.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: { author: { include: { profile: true } } },
        }),
        prisma.resource.count({ where }),
      ]);

      return res.json({
        success: true,
        content: resources.map((resource) => ({
          id: resource.id,
          kind: 'resource',
          type: resource.type,
          title: resource.title,
          status: resource.status,
          rejectReason: resource.rejectReason,
          authorId: resource.authorId,
          authorName:
            `${resource.author.profile?.firstName ?? ''} ${resource.author.profile?.lastName ?? ''}`.trim() ||
            resource.author.email,
          createdAt: resource.createdAt.toISOString(),
        })),
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    }

    if (type === 'workshop') {
      const where = {
        ...(status && ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED'].includes(status)
          ? { status: status as 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' }
          : {}),
      };

      const [workshops, total] = await Promise.all([
        prisma.workshop.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            author: { include: { profile: true } },
            _count: { select: { enrollments: true } },
          },
        }),
        prisma.workshop.count({ where }),
      ]);

      return res.json({
        success: true,
        content: workshops.map((workshop) => ({
          id: workshop.id,
          kind: 'workshop',
          title: workshop.title,
          status: workshop.status,
          rejectReason: workshop.rejectReason,
          startsAt: workshop.startsAt.toISOString(),
          capacity: workshop.capacity,
          enrollments: workshop._count.enrollments,
          authorId: workshop.authorId,
          authorName:
            `${workshop.author.profile?.firstName ?? ''} ${workshop.author.profile?.lastName ?? ''}`.trim() ||
            workshop.author.email,
          createdAt: workshop.createdAt.toISOString(),
        })),
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    }

    return res.status(400).json({ success: false, message: 'type debe ser workshop o resource' });
  } catch (error) {
    return next(error);
  }
});

adminRouter.patch('/psy-content/:type/:id/status', async (req, res, next) => {
  try {
    const { type, id } = req.params;
    const payload = psyContentStatusSchema.parse(req.body);
    const reviewedById = req.user?.id ?? null;

    if (type === 'workshop') {
      const existing = await prisma.workshop.findUnique({ where: { id } });

      if (!existing) {
        return res.status(404).json({ success: false, message: 'Taller no encontrado' });
      }

      await prisma.workshop.update({
        where: { id },
        data: {
          status: payload.status,
          rejectReason: payload.status === 'REJECTED' ? payload.reason ?? null : null,
          reviewedAt: new Date(),
          reviewedById,
        },
      });

      await prisma.notification.create({
        data: {
          userId: existing.authorId,
          kind: 'content',
          title:
            payload.status === 'APPROVED'
              ? 'Tu taller fue aprobado'
              : payload.status === 'REJECTED'
                ? 'Tu taller fue rechazado'
                : 'Tu taller vuelve a estado pendiente',
          body:
            payload.status === 'REJECTED'
              ? payload.reason ?? 'Revisa el contenido y vuelve a enviarlo.'
              : existing.title,
          link: `/psy/talleres/${existing.id}`,
        },
      });

      return res.json({ success: true, message: 'Estado del taller actualizado' });
    }

    if (type === 'resource') {
      const existing = await prisma.resource.findUnique({ where: { id } });

      if (!existing) {
        return res.status(404).json({ success: false, message: 'Recurso no encontrado' });
      }

      await prisma.resource.update({
        where: { id },
        data: {
          status: payload.status,
          rejectReason: payload.status === 'REJECTED' ? payload.reason ?? null : null,
          reviewedAt: new Date(),
          reviewedById,
        },
      });

      await prisma.notification.create({
        data: {
          userId: existing.authorId,
          kind: 'content',
          title:
            payload.status === 'APPROVED'
              ? 'Tu recurso fue aprobado'
              : payload.status === 'REJECTED'
                ? 'Tu recurso fue rechazado'
                : 'Tu recurso vuelve a estado pendiente',
          body:
            payload.status === 'REJECTED'
              ? payload.reason ?? 'Revisa el contenido y vuelve a enviarlo.'
              : existing.title,
          link: `/psy/recursos/${existing.id}`,
        },
      });

      return res.json({ success: true, message: 'Estado del recurso actualizado' });
    }

    return res.status(400).json({ success: false, message: 'type debe ser workshop o resource' });
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
