import { supabase } from './supabase';
import type { SessionUser } from '../types/session';

export async function apiFetch<T>(
  path: string,
  options: { method?: string; body?: Record<string, unknown> | FormData } = {}
): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('No hay sesión activa');
  }

  const isFormData = options.body instanceof FormData;
  let body: BodyInit | null | undefined = undefined;

  if (options.body !== undefined) {
    body = isFormData
      ? (options.body as FormData)
      : JSON.stringify(options.body as Record<string, unknown>);
  }

  const response = await fetch(`${import.meta.env.VITE_API_URL ?? 'http://localhost:3002'}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      ...(isFormData ? undefined : { 'Content-Type': 'application/json' }),
    },
    body,
  });

  const data = (await response.json().catch(() => ({}))) as T & { message?: string };

  if (!response.ok) {
    throw new Error(data?.message || 'Request failed');
  }

  return data;
}

export type LoginResponse = {
  success: boolean;
  session: { access_token: string; refresh_token: string; expires_at: number };
  user: { id: string; email: string; role: string; profile: Record<string, unknown> | null; factors: unknown[] };
};

export type MfaStatusResponse = {
  success: boolean;
  mfaEnabled: boolean;
  mfaType: 'totp' | null;
  factorId: string | null;
};

export async function getMe(): Promise<{ user: SessionUser }> {
  return apiFetch<{ user: SessionUser }>('/api/auth/me');
}

export async function getMfaStatus(): Promise<MfaStatusResponse> {
  return apiFetch<MfaStatusResponse>('/api/auth/mfa/status');
}

export async function signOut(): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // eslint-disable-next-line no-empty
    }
  }
  await supabase.auth.signOut();
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
  country: string;
  phone: string;
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
  return apiFetch<AdminUserStats>('/api/admin/stats/users');
}

export async function getAdminUsers(params?: {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<AdminUsersResponse> {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.status) query.set('status', params.status);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));

  const qs = query.toString();
  return apiFetch<AdminUsersResponse>(qs ? `/api/admin/users?${qs}` : '/api/admin/users');
}

export async function updateUserStatus(
  userId: string,
  status: 'ACTIVE' | 'SUSPENDED',
  suspendedReason?: string
): Promise<{ success: boolean; message: string }> {
  return apiFetch<{ success: boolean; message: string }>(`/api/admin/users/${userId}/status`, {
    method: 'PATCH',
    body: { status, suspendedReason },
  });
}

export async function deleteUser(userId: string): Promise<{ success: boolean; message: string }> {
  return apiFetch<{ success: boolean; message: string }>(`/api/admin/users/${userId}`, {
    method: 'DELETE',
  });
}

export async function getAdminPsyStats(): Promise<AdminPsyStats> {
  return apiFetch<AdminPsyStats>('/api/admin/stats/psychologists');
}

export async function getPsychologists(params?: {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<AdminPsychologistsResponse> {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.status) query.set('status', params.status);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));

  const qs = query.toString();
  return apiFetch<AdminPsychologistsResponse>(qs ? `/api/admin/psychologists?${qs}` : '/api/admin/psychologists');
}

export async function approvePsychologist(
  psyId: string
): Promise<{ success: boolean; message: string }> {
  return apiFetch<{ success: boolean; message: string }>(`/api/admin/psychologists/${psyId}/approve`, {
    method: 'PATCH',
  });
}
