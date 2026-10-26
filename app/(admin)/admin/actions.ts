'use server';

import { prisma } from '@/lib/db/prisma';
import { createAdminClient } from '@/lib/supabase/admin';
import { authorize } from '@/lib/auth/guard';

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

  const page = params?.page ?? 1;
  const limit = params?.limit ?? 10;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  if (params?.status && params.status !== 'all') {
    where.status = params.status;
  }

  if (params?.role && params.role !== 'all') {
    where.role = params.role;
  }

  if (params?.search) {
    const term = params.search.toLowerCase();
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
): Promise<{ success: boolean; message: string }> {
  const session = await authorize(['ADMIN']);
  if (!session) {
    return { success: false, message: 'No autorizado' };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { status: status as 'ACTIVE' | 'SUSPENDED' | 'PENDING' },
  });

  return { success: true, message: status === 'ACTIVE' ? 'Usuario reactivado' : 'Usuario suspendido' };
}

export async function deleteUser(
  userId: string
): Promise<{ success: boolean; message: string }> {
  const session = await authorize(['ADMIN']);
  if (!session) {
    return { success: false, message: 'No autorizado' };
  }

  await prisma.user.delete({
    where: { id: userId },
  });

  return { success: true, message: 'Usuario eliminado correctamente' };
}

export async function updateUserRole(
  userId: string,
  role: 'USER' | 'PSYCHOLOGIST' | 'ADMIN'
): Promise<{ success: boolean; message: string }> {
  const session = await authorize(['ADMIN']);
  if (!session) {
    return { success: false, message: 'No autorizado' };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { role: role as 'USER' | 'PSYCHOLOGIST' | 'ADMIN' },
  });

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

  const page = params?.page ?? 1;
  const limit = params?.limit ?? 10;
  const skip = (page - 1) * limit;

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

export type AdminUserUpdatePayload = {
  email?: string;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
};

export async function updateUserProfile(
  userId: string,
  payload: AdminUserUpdatePayload
): Promise<{ success: boolean; message: string }> {
  const session = await authorize(['ADMIN']);
  if (!session) {
    return { success: false, message: 'No autorizado' };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, profile: { select: { username: true, firstName: true, lastName: true } } },
  });

  if (!user) {
    return { success: false, message: 'Usuario no encontrado' };
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      email: payload.email ?? user.email,
      profile: {
        upsert: {
          create: {
            username: payload.username ?? null,
            firstName: payload.firstName ?? null,
            lastName: payload.lastName ?? null,
          },
          update: {
            username: payload.username ?? user.profile?.username ?? null,
            firstName: payload.firstName ?? user.profile?.firstName ?? null,
            lastName: payload.lastName ?? user.profile?.lastName ?? null,
          },
        },
      },
    },
  });

  return { success: true, message: 'Usuario actualizado' };
}

export async function resetUserPassword(
  userId: string
): Promise<{ success: boolean; message: string }> {
  const session = await authorize(['ADMIN']);
  if (!session) {
    return { success: false, message: 'No autorizado' };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  if (!user) {
    return { success: false, message: 'Usuario no encontrado' };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.auth.admin.generateLink({
    type: 'recovery',
    email: user.email,
  });

  if (error) {
    return { success: false, message: error.message };
  }

  return { success: true, message: 'Correo de restablecimiento enviado' };
}

export async function approveUser(
  userId: string
): Promise<{ success: boolean; message: string }> {
  const session = await authorize(['ADMIN']);
  if (!session) {
    return { success: false, message: 'No autorizado' };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!user) {
    return { success: false, message: 'Usuario no encontrado' };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { status: 'ACTIVE' },
  });

  return { success: true, message: 'Usuario aprobado correctamente' };
}

export async function resendConfirmationEmail(
  userId: string
): Promise<{ success: boolean; message: string }> {
  const session = await authorize(['ADMIN']);
  if (!session) {
    return { success: false, message: 'No autorizado' };
  }

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
): Promise<{ success: boolean; message: string }> {
  const session = await authorize(['ADMIN']);
  if (!session) {
    return { success: false, message: 'No autorizado' };
  }

  const profile = await prisma.psychologistProfile.findUnique({
    where: { id: psyId },
    include: { profile: { select: { user: { select: { email: true } } } } },
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
  if (payload.email !== undefined) {
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

  await prisma.psychologistProfile.update({
    where: { id: psyId },
    data: data as never,
  });

  return { success: true, message: 'Psicólogo actualizado' };
}
