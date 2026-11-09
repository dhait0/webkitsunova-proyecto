import 'server-only';

import { prisma } from '@/lib/db/prisma';
import { createAdminClient } from '@/lib/supabase/admin';
import { createAnonClient } from '@/lib/supabase/anon';

export type UserSettings = {
  email: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
};

export async function getUserSettings(userId: string, email: string): Promise<UserSettings> {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { firstName: true, lastName: true, username: true },
  });

  return {
    email,
    firstName: profile?.firstName ?? null,
    lastName: profile?.lastName ?? null,
    username: profile?.username ?? null,
  };
}

export async function updateUserProfile(
  userId: string,
  data: { firstName?: string | null; lastName?: string | null; username: string },
): Promise<void> {
  try {
    await prisma.profile.upsert({
      where: { userId },
      create: {
        userId,
        firstName: data.firstName ?? null,
        lastName: data.lastName ?? null,
        username: data.username,
      },
      update: {
        firstName: data.firstName ?? null,
        lastName: data.lastName ?? null,
        username: data.username,
      },
    });
  } catch (error) {
    const err = error as { code?: string };
    if (err.code === 'P2002') {
      throw new Error('Ese nombre de usuario ya está en uso');
    }
    throw error;
  }

  const supabase = createAdminClient();
  const { error } = await supabase.auth.admin.updateUserById(userId, {
    user_metadata: {
      first_name: data.firstName ?? null,
      last_name: data.lastName ?? null,
      username: data.username,
    },
  });

  if (error) {
    throw new Error(error.message || 'No se pudo actualizar los metadatos de usuario');
  }
}

export async function changeUserPassword(
  userId: string,
  email: string,
  currentPassword: string,
  nextPassword: string,
): Promise<void> {
  const { error: signInError } = await createAnonClient().auth.signInWithPassword({
    email,
    password: currentPassword,
  });

  if (signInError) {
    throw new Error('La contraseña actual no es correcta');
  }

  const supabase = createAdminClient();
  const { error } = await supabase.auth.admin.updateUserById(userId, {
    password: nextPassword,
  });

  if (error) {
    throw new Error(error.message || 'No se pudo cambiar la contraseña');
  }
}
