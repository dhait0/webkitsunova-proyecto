'use server';

import { prisma } from '@/lib/db/prisma';
import { createAdminClient } from '@/lib/supabase/admin';
import { createAnonClient } from '@/lib/supabase/anon';
import { authorize } from '@/lib/auth/guard';
import { z } from 'zod';

type ActionResult = { success: boolean; message: string };

const idSchema = z.string().trim().min(1).max(100);
const statusSchema = z.enum(['ACTIVE', 'SUSPENDED']);
const roleSchema = z.enum(['USER', 'PSYCHOLOGIST']);
const emailSchema = z.string().trim().toLowerCase().email().max(254);
const optionalText = (max: number) => z.string().trim().max(max).nullable().optional();

const userUpdateSchema = z.object({
  email: emailSchema.optional(),
  username: z
    .string()
    .trim()
    .regex(/^[a-zA-Z0-9._]{3,30}$/)
    .nullable()
    .optional(),
  firstName: optionalText(60),
  lastName: optionalText(60),
});

const psychologistUpdateSchema = z.object({
  name: optionalText(120),
  email: emailSchema.nullable().optional(),
  specialties: z.array(z.string().trim().min(1).max(60)).max(20).optional(),
  bio: optionalText(2000),
  country: optionalText(60),
  phone: optionalText(30),
  sessionPrice: z.number().finite().min(0).max(100_000_000).nullable().optional(),
});

const INVALID_INPUT: ActionResult = { success: false, message: 'Datos no válidos' };
const OTHER_ADMIN: ActionResult = { success: false, message: 'No puedes modificar a otro administrador' };

/** Page and limit come from the client: clamp them before they reach Prisma. */
function pageParams(page?: number, limit?: number) {
  const safeLimit = Number.isInteger(limit) ? Math.min(Math.max(limit as number, 1), 100) : 10;
  const safePage = Number.isInteger(page) ? Math.max(page as number, 1) : 1;
  return { page: safePage, limit: safeLimit, skip: (safePage - 1) * safeLimit };
}

/**
 * Supabase Auth owns the email and the role the guard trusts, so every change
 * to either must reach it as well as Prisma.
 */
async function setAuthEmail(userId: string, email: string): Promise<string | null> {
  const { error } = await createAdminClient().auth.admin.updateUserById(userId, {
    email,
    email_confirm: true,
  });
  return error ? error.message : null;
}

async function setAuthRole(userId: string, role: string): Promise<string | null> {
  const { error } = await createAdminClient().auth.admin.updateUserById(userId, {
    app_metadata: { role },
  });
  return error ? error.message : null;
}

function isUniqueViolation(error: unknown): boolean {
  return (error as { code?: string } | null)?.code === 'P2002';
}

export type AdminUserStats = {
  success: boolean;
  stats: {
    total: number;
    active: number;
    suspended: number;
    pending: number;
  };
};

export type AdminUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  status: string;
  role: string;
  twoFactorEnabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminUsersResponse = {
  success: boolean;
  users: AdminUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type AdminPsyStats = {
  success: boolean;
  stats: {
    total: number;
    approved: number;
    pending: number;
    suspended: number;
  };
};

export type AdminPsychologist = {
  id: string;
  email: string;
  name: string;
  specialty: string;
  specialties: string[];
  status: string;
  verified: boolean;
  patients: number;
  rating: number;
  reviews: number;
  sessionPrice: number | null;
  country: string | null;
  phone: string | null;
  bio: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminPsychologistsResponse = {
  success: boolean;
  psychologists: AdminPsychologist[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export async function getAdminUserStats(): Promise<AdminUserStats> {
  const session = await authorize(['ADMIN']);
  if (!session) {
    return { success: false, stats: { total: 0, active: 0, suspended: 0, pending: 0 } };
  }

  const [total, active, suspended, pending] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: 'ACTIVE' } }),
    prisma.user.count({ where: { status: 'SUSPENDED' } }),
    prisma.user.count({ where: { status: 'PENDING' } }),
  ]);

  return { success: true, stats: { total, active, suspended, pending } };
}

export async function getAdminUsers(params?: {
  search?: string;
  status?: string;
  role?: string;
  page?: number;
  limit?: number;
}): Promise<AdminUsersResponse> {
  const session = await authorize(['ADMIN']);
  if (!session) {
    return { success: false, users: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 1 } };
  }

  const { page, limit, skip } = pageParams(params?.page, params?.limit);

  const where: Record<string, unknown> = {};

  if (params?.status && params.status !== 'all') {
    where.status = z.enum(['ACTIVE', 'SUSPENDED', 'PENDING']).catch('PENDING').parse(params.status);
  }

  if (params?.role && params.role !== 'all') {
    where.role = z.enum(['USER', 'PSYCHOLOGIST', 'ADMIN']).catch('USER').parse(params.role);
  }

  if (params?.search) {
    const term = params.search.slice(0, 100).toLowerCase();
    (where as { OR?: unknown[] }).OR = [
      { email: { contains: term, mode: 'insensitive' } },
      { profile: { firstName: { contains: term, mode: 'insensitive' } } },
      { profile: { lastName: { contains: term, mode: 'insensitive' } } },
      { profile: { username: { contains: term, mode: 'insensitive' } } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where: where as never,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        twoFactorEnabled: true,
        createdAt: true,
        updatedAt: true,
        profile: {
          select: {
            firstName: true,
            lastName: true,
            username: true,
          },
        },
      },
    }),
    prisma.user.count({ where: where as never }),
  ]);

  const mapped = users.map((u) => ({
    id: u.id,
    email: u.email,
    status: u.status,
    role: u.role,
    firstName: u.profile?.firstName ?? null,
    lastName: u.profile?.lastName ?? null,
    username: u.profile?.username ?? null,
    twoFactorEnabled: u.twoFactorEnabled,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
  }));

  return {
    success: true,
    users: mapped,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}


export async function updateUserStatus(
  userId: string,
  status: 'ACTIVE' | 'SUSPENDED',
  _reason?: string
): Promise<ActionResult> {
  const session = await authorize(['ADMIN']);
  if (!session) {
    return { success: false, message: 'No autorizado' };
  }

  const id = idSchema.safeParse(userId);
  const nextStatus = statusSchema.safeParse(status);
  if (!id.success || !nextStatus.success) return INVALID_INPUT;

  if (session.id === id.data) {
    return { success: false, message: 'No puedes modificar tu propia cuenta' };
  }

  const target = await prisma.user.findUnique({
    where: { id: id.data },
    select: { role: true },
  });

  if (!target) {
    return { success: false, message: 'Usuario no encontrado' };
  }

  if (target.role === 'ADMIN') {
    return { success: false, message: 'No puedes suspender a otro administrador' };
  }

  await prisma.user.update({
    where: { id: id.data },
    data: { status: nextStatus.data },
  });

  return { success: true, message: nextStatus.data === 'ACTIVE' ? 'Usuario reactivado' : 'Usuario suspendido' };
}


export async function deleteUser(userId: string): Promise<ActionResult> {
  const session = await authorize(['ADMIN']);
  if (!session) {
    return { success: false, message: 'No autorizado' };
  }

  const id = idSchema.safeParse(userId);
  if (!id.success) return INVALID_INPUT;

  if (session.id === id.data) {
    return { success: false, message: 'No puedes eliminar tu propia cuenta' };
  }

  const target = await prisma.user.findUnique({
    where: { id: id.data },
    select: { role: true },
  });

  if (!target) {
    return { success: false, message: 'Usuario no encontrado' };
  }

  if (target.role === 'ADMIN') {
    return { success: false, message: 'No puedes eliminar a otro administrador' };
  }

  // Remove the Auth identity first: deleting only the Prisma row would leave an
  // authenticated user without a profile row, which the guard rejects forever
  // and which keeps the email address taken.
  const { error } = await createAdminClient().auth.admin.deleteUser(id.data);
  if (error && !/not.?found/i.test(error.message)) {
    return { success: false, message: 'No se pudo eliminar la identidad de autenticación' };
  }

  await prisma.user.delete({
    where: { id: id.data },
  });

  return { success: true, message: 'Usuario eliminado correctamente' };
}


export async function updateUserRole(
  userId: string,
  role: 'USER' | 'PSYCHOLOGIST' | 'ADMIN'
): Promise<ActionResult> {
  const session = await authorize(['ADMIN']);
  if (!session) {
    return { success: false, message: 'No autorizado' };
  }

  const id = idSchema.safeParse(userId);
  if (!id.success) return INVALID_INPUT;

  if (session.id === id.data) {
    return { success: false, message: 'No puedes modificar tu propio rol' };
  }

  if (role === 'ADMIN') {
    return { success: false, message: 'No está permitido asignar rol administrador' };
  }

  const nextRole = roleSchema.safeParse(role);
  if (!nextRole.success) return INVALID_INPUT;

  const target = await prisma.user.findUnique({
    where: { id: id.data },
    select: { role: true },
  });

  if (!target) {
    return { success: false, message: 'Usuario no encontrado' };
  }

  if (target.role === 'ADMIN') {
    return OTHER_ADMIN;
  }

  const authError = await setAuthRole(id.data, nextRole.data);
  if (authError) {
    return { success: false, message: 'No se pudo actualizar el rol en la autenticación' };
  }

  try {
    await prisma.user.update({
      where: { id: id.data },
      data: { role: nextRole.data },
    });
  } catch {
    await setAuthRole(id.data, target.role);
    return { success: false, message: 'No se pudo actualizar el rol' };
  }

  return { success: true, message: 'Rol actualizado correctamente' };
}

export async function getAdminPsyStats(): Promise<AdminPsyStats> {
  const session = await authorize(['ADMIN']);
  if (!session) {
    return { success: false, stats: { total: 0, approved: 0, pending: 0, suspended: 0 } };
  }

  const [total, approved, pending, suspended] = await Promise.all([
    prisma.psychologistProfile.count(),
    prisma.psychologistProfile.count({ where: { isApproved: true, isVerified: true } }),
    prisma.psychologistProfile.count({ where: { isApproved: false } }),
    prisma.psychologistProfile.count({ where: { isApproved: true, isVerified: false } }),
  ]);

  return { success: true, stats: { total, approved, pending, suspended } };
}

export async function getPsychologists(params?: {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<AdminPsychologistsResponse> {
  const session = await authorize(['ADMIN']);
  if (!session) {
    return { success: false, psychologists: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 1 } };
  }

  const { page, limit, skip } = pageParams(params?.page, params?.limit);

  const where: Record<string, unknown> = {};

  if (params?.status && params.status !== 'all') {
    if (params.status === 'active') {
      where.isApproved = true;
      where.isVerified = true;
    } else if (params.status === 'revision') {
      where.isApproved = false;
    } else if (params.status === 'suspendido') {
      where.isApproved = true;
      where.isVerified = false;
    }
  }

  if (params?.search) {
    const term = params.search.toLowerCase();
    (where as { OR?: unknown[] }).OR = [
      { profile: { user: { email: { contains: term, mode: 'insensitive' } } } },
      { profile: { firstName: { contains: term, mode: 'insensitive' } } },
      { profile: { lastName: { contains: term, mode: 'insensitive' } } },
      { specialties: { has: term } },
    ];
  }

  const psychologists = await prisma.psychologistProfile.findMany({
    where: where as never,
    skip,
    take: limit,
    include: {
      profile: {
        select: {
          firstName: true,
          lastName: true,
          country: true,
          phone: true,
          bio: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: {
              email: true,
            },
          },
        },
      },
    },
  });

  const total = await prisma.psychologistProfile.count({ where: where as never });

  const mapped = psychologists.map((p) => {
    const firstName = (p as unknown as { profile: { firstName: string | null } }).profile?.firstName ?? '';
    const lastName = (p as unknown as { profile: { lastName: string | null } }).profile?.lastName ?? '';
    const name = [firstName, lastName].filter(Boolean).join(' ').trim();
    const profile = (p as unknown as { profile: {
      user?: { email: string };
      country?: string | null;
      phone?: string | null;
      bio?: string | null;
      createdAt?: Date;
      updatedAt?: Date;
    } }).profile;

    return {
      id: p.id,
      email: profile?.user?.email ?? '',
      name,
      specialty: p.specialties?.[0] ?? '',
      specialties: p.specialties ?? [],
      status: p.isApproved ? (p.isVerified ? 'activo' : 'revisión') : 'pendiente',
      verified: p.isVerified,
      patients: p.patientsCount,
      rating: p.rating,
      reviews: p.reviewsCount,
      sessionPrice: p.sessionPrice,
      country: profile?.country ?? null,
      phone: profile?.phone ?? null,
      bio: profile?.bio ?? '',
      createdAt: profile?.createdAt?.toISOString() ?? '',
      updatedAt: profile?.updatedAt?.toISOString() ?? '',
    };
  });

  return {
    success: true,
    psychologists: mapped,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

export async function approvePsychologist(
  psyId: string
): Promise<{ success: boolean; message: string }> {
  const session = await authorize(['ADMIN']);
  if (!session) {
    return { success: false, message: 'No autorizado' };
  }

  if (!idSchema.safeParse(psyId).success) return INVALID_INPUT;

  const profile = await prisma.psychologistProfile.findUnique({
    where: { id: psyId },
    select: { profileId: true },
  });

  if (!profile) {
    return { success: false, message: 'Psicólogo no encontrado' };
  }

  await prisma.psychologistProfile.update({
    where: { id: psyId },
    data: { isApproved: true, isVerified: true },
  });

  return { success: true, message: 'Psicólogo aprobado correctamente' };
}

export async function rejectPsychologist(
  psyId: string
): Promise<{ success: boolean; message: string }> {
  const session = await authorize(['ADMIN']);
  if (!session) {
    return { success: false, message: 'No autorizado' };
  }

  if (!idSchema.safeParse(psyId).success) return INVALID_INPUT;

  const profile = await prisma.psychologistProfile.findUnique({
    where: { id: psyId },
    select: { profileId: true },
  });

  if (!profile) {
    return { success: false, message: 'Psicólogo no encontrado' };
  }

  await prisma.psychologistProfile.update({
    where: { id: psyId },
    data: { isApproved: false, isVerified: false },
  });

  return { success: true, message: 'Solicitud de psicólogo rechazada' };
}

export type AdminUserUpdatePayload = {
  email?: string;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
};


export async function updateUserProfile(
  userId: string,
  payload: AdminUserUpdatePayload
): Promise<ActionResult> {
  const session = await authorize(['ADMIN']);
  if (!session) {
    return { success: false, message: 'No autorizado' };
  }

  const id = idSchema.safeParse(userId);
  const data = userUpdateSchema.safeParse(payload);
  if (!id.success || !data.success) return INVALID_INPUT;

  const user = await prisma.user.findUnique({
    where: { id: id.data },
    select: { email: true, role: true, profile: { select: { username: true, firstName: true, lastName: true } } },
  });

  if (!user) {
    return { success: false, message: 'Usuario no encontrado' };
  }

  // Changing another administrator's email would let this admin take over
  // that account through a password reset.
  if (user.role === 'ADMIN' && session.id !== id.data) {
    return OTHER_ADMIN;
  }

  const emailChanged = data.data.email !== undefined && data.data.email !== user.email;

  if (emailChanged) {
    const taken = await prisma.user.findUnique({ where: { email: data.data.email }, select: { id: true } });
    if (taken) {
      return { success: false, message: 'Ese correo ya está en uso' };
    }
    const authError = await setAuthEmail(id.data, data.data.email as string);
    if (authError) {
      return { success: false, message: 'No se pudo actualizar el correo en la autenticación' };
    }
  }

  try {
    await prisma.user.update({
      where: { id: id.data },
      data: {
        email: data.data.email ?? user.email,
        profile: {
          upsert: {
            create: {
              username: data.data.username ?? null,
              firstName: data.data.firstName ?? null,
              lastName: data.data.lastName ?? null,
            },
            update: {
              username: data.data.username ?? user.profile?.username ?? null,
              firstName: data.data.firstName ?? user.profile?.firstName ?? null,
              lastName: data.data.lastName ?? user.profile?.lastName ?? null,
            },
          },
        },
      },
    });
  } catch (error) {
    if (emailChanged) await setAuthEmail(id.data, user.email);
    return {
      success: false,
      message: isUniqueViolation(error) ? 'Ese nombre de usuario ya está en uso' : 'No se pudo actualizar el usuario',
    };
  }

  return { success: true, message: 'Usuario actualizado' };
}


export async function resetUserPassword(userId: string): Promise<ActionResult> {
  const session = await authorize(['ADMIN']);
  if (!session) {
    return { success: false, message: 'No autorizado' };
  }

  const id = idSchema.safeParse(userId);
  if (!id.success) return INVALID_INPUT;

  const user = await prisma.user.findUnique({
    where: { id: id.data },
    select: { email: true, role: true },
  });

  if (!user) {
    return { success: false, message: 'Usuario no encontrado' };
  }

  if (user.role === 'ADMIN' && session.id !== id.data) {
    return OTHER_ADMIN;
  }

  // resetPasswordForEmail sends the message; generateLink only creates a link.
  const { error } = await createAnonClient().auth.resetPasswordForEmail(user.email);

  if (error) {
    return { success: false, message: error.message };
  }

  return { success: true, message: 'Correo de restablecimiento enviado' };
}


export async function approveUser(userId: string): Promise<ActionResult> {
  const session = await authorize(['ADMIN']);
  if (!session) {
    return { success: false, message: 'No autorizado' };
  }

  const id = idSchema.safeParse(userId);
  if (!id.success) return INVALID_INPUT;

  // Only a pending account is approved; a suspended one is reactivated through
  // updateUserStatus, which keeps the administrator protections.
  const { count } = await prisma.user.updateMany({
    where: { id: id.data, status: 'PENDING' },
    data: { status: 'ACTIVE' },
  });

  if (count === 0) {
    const exists = await prisma.user.findUnique({ where: { id: id.data }, select: { id: true } });
    return {
      success: false,
      message: exists ? 'El usuario no está pendiente de aprobación' : 'Usuario no encontrado',
    };
  }

  return { success: true, message: 'Usuario aprobado correctamente' };
}

export async function resendConfirmationEmail(
  userId: string
): Promise<{ success: boolean; message: string }> {
  const session = await authorize(['ADMIN']);
  if (!session) {
    return { success: false, message: 'No autorizado' };
  }

  if (!idSchema.safeParse(userId).success) return INVALID_INPUT;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  if (!user) {
    return { success: false, message: 'Usuario no encontrado' };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: user.email,
  });

  if (error) {
    return { success: false, message: error.message };
  }

  return { success: true, message: 'Correo de confirmación reenviado' };
}

export type AdminPsychologistUpdatePayload = {
  name?: string | null;
  email?: string | null;
  specialties?: string[];
  bio?: string | null;
  country?: string | null;
  phone?: string | null;
  sessionPrice?: number | null;
};

export async function updatePsychologistProfile(
  psyId: string,
  payload: AdminPsychologistUpdatePayload
): Promise<ActionResult> {
  const session = await authorize(['ADMIN']);
  if (!session) {
    return { success: false, message: 'No autorizado' };
  }

  const parsedId = idSchema.safeParse(psyId);
  const parsedPayload = psychologistUpdateSchema.safeParse(payload);
  if (!parsedId.success || !parsedPayload.success) return INVALID_INPUT;
  psyId = parsedId.data;
  payload = parsedPayload.data;

  const profile = await prisma.psychologistProfile.findUnique({
    where: { id: psyId },
    include: { profile: { select: { user: { select: { id: true, email: true } } } } },
  });

  if (!profile) {
    return { success: false, message: 'Psicólogo no encontrado' };
  }

  const data: Record<string, unknown> = {};

  if (payload.specialties !== undefined) {
    data.specialties = payload.specialties;
  }
  if (payload.bio !== undefined) {
    data.profile = {
      update: { bio: payload.bio },
    };
  }
  if (payload.country !== undefined || payload.phone !== undefined) {
    data.profile = {
      ...(data.profile as Record<string, unknown> | undefined),
      update: {
        ...((data.profile as Record<string, unknown> | undefined)?.update as Record<string, unknown> | undefined),
        ...(payload.country !== undefined ? { country: payload.country } : {}),
        ...(payload.phone !== undefined ? { phone: payload.phone } : {}),
      },
    };
  }
  if (payload.sessionPrice !== undefined) {
    data.sessionPrice = payload.sessionPrice;
  }
  const authUser = profile.profile.user;
  const emailChanged = Boolean(payload.email) && payload.email !== authUser.email;

  if (emailChanged) {
    const taken = await prisma.user.findUnique({ where: { email: payload.email as string }, select: { id: true } });
    if (taken) {
      return { success: false, message: 'Ese correo ya está en uso' };
    }
    const authError = await setAuthEmail(authUser.id, payload.email as string);
    if (authError) {
      return { success: false, message: 'No se pudo actualizar el correo en la autenticación' };
    }
  }

  if (emailChanged) {
    data.profile = {
      ...(data.profile as Record<string, unknown> | undefined),
      update: {
        ...((data.profile as Record<string, unknown> | undefined)?.update as Record<string, unknown> | undefined),
        user: { update: { email: payload.email } },
      },
    };
  }
  if (payload.name !== undefined) {
    const [firstName, ...rest] = (payload.name ?? '').split(' ');
    const lastName = rest.join(' ');
    data.profile = {
      ...(data.profile as Record<string, unknown> | undefined),
      update: {
        ...((data.profile as Record<string, unknown> | undefined)?.update as Record<string, unknown> | undefined),
        firstName: firstName || null,
        lastName: lastName || null,
      },
    };
  }

  try {
    await prisma.psychologistProfile.update({
      where: { id: psyId },
      data: data as never,
    });
  } catch {
    if (emailChanged) await setAuthEmail(authUser.id, authUser.email);
    return { success: false, message: 'No se pudo actualizar el psicólogo' };
  }

  return { success: true, message: 'Psicólogo actualizado' };
}
