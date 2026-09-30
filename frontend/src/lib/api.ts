import { supabase } from './supabase';
import type { SessionUser } from '../types/session';

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

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

  const data = (await response.json().catch(() => ({}))) as T & {
    message?: string;
    code?: string;
  };

  if (!response.ok) {
    throw new ApiError(
      data?.message || 'Request failed',
      response.status,
      data?.code
    );
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
  reason?: string
): Promise<{ success: boolean; message: string }> {
  return apiFetch<{ success: boolean; message: string }>(`/api/admin/users/${userId}/status`, {
    method: 'PATCH',
    body: { status, reason },
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

// ---------------------------------------------------------------------------
// Psychologist area (/api/psy)
// ---------------------------------------------------------------------------

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PsyAvailabilitySlot = {
  id?: string;
  weekday: number;
  weekdayLabel?: string;
  start: string;
  end: string;
};

export type PsyProfile = {
  name: string;
  email: string;
  accountStatus: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  country: string | null;
  birthDate: string | null;
  bio: string | null;
  avatarUrl: string | null;
  specialties: string[];
  sessionPrice: number | null;
  currency: string;
  isApproved: boolean;
  isVerified: boolean;
  isAcceptingNew: boolean;
  rating: number;
  reviewsCount: number;
  patientsCount: number;
};

export type PsyDashboard = {
  success: boolean;
  profile: Omit<PsyProfile, 'accountStatus' | 'firstName' | 'lastName' | 'phone' | 'avatarUrl' | 'rating' | 'reviewsCount' | 'patientsCount'> & {
    availability: Array<{ weekday: number; start: string; end: string }>;
  };
  stats: {
    activePatients: number;
    pendingMessages: number;
    sessionsToday: number;
    upcomingSessions: number;
    workshops: number;
    resources: number;
  };
  nextAppointment: PsyAppointmentSummary | null;
  todayAppointments: PsyAppointmentSummary[];
  recentPatients: PsyPatientSummary[];
};

export type PsyAppointmentSummary = {
  id: string;
  patientUserId?: string;
  patientName: string;
  startsAt: string;
  status: string;
  reason: string | null;
};

export type PsyPatientSummary = {
  userId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  country: string | null;
  status?: string;
  mood: 'ESTABLE' | 'ATENCION' | 'CRITICO' | 'SIN_DATOS';
  lastSessionAt?: string | null;
  nextSessionAt?: string | null;
  lastActivityAt?: string | null;
  completedSessions?: number;
  startedAt?: string;
  endedAt?: string | null;
};

export type PsyAppointment = PsyAppointmentSummary & {
  endsAt: string;
  type: string;
  patientNote: string | null;
  psyNote: string | null;
};

export type PsyPatientDetail = PsyPatientSummary & {
  phone: string | null;
  birthDate: string | null;
  bio: string | null;
  startedAt: string;
};

export type PsyWorkshop = {
  id: string;
  title: string;
  description: string;
  coverUrl: string | null;
  focusArea: string;
  startsAt: string;
  durationHours: number;
  capacity: number;
  priceCents: number;
  currency: string;
  status: string;
  rejectReason: string | null;
  authorId: string;
  authorName: string;
  enrolled: number;
  occupancyRate: number;
  createdAt: string;
};

export type PsyResource = {
  id: string;
  type: string;
  title: string;
  description: string;
  coverUrl: string | null;
  fileUrl: string | null;
  fileName: string | null;
  readingMins: number | null;
  focusArea: string | null;
  status: string;
  rejectReason: string | null;
  authorId: string;
  authorName: string;
  createdAt: string;
};

export type PsyConversation = {
  id: string;
  isGroup: boolean;
  isSystem: boolean;
  title: string;
  participants: Array<{ userId: string; name: string; role: string; avatarUrl: string | null }>;
  lastMessage: { body: string; senderId: string; createdAt: string } | null;
  lastMessageAt: string;
  unread: number;
  blocked: boolean;
};

export type PsyNotification = {
  id: string;
  kind: string;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  createdAt: string;
};

export type PsyPreferences = {
  newAppointments: boolean;
  newMessages: boolean;
  patientReports: boolean;
  moodAlerts: boolean;
  platformNews: boolean;
};

export type PsyReferral = {
  id: string;
  status: string;
  note: string | null;
  patientUserId: string;
  fromPsychologistId: string;
  fromPsychologistName: string;
  toPsychologistId: string;
  toPsychologistName: string;
  createdAt: string;
  respondedAt: string | null;
};

function query(params?: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== '') {
      search.set(key, String(value));
    }
  }

  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export async function getPsyDashboard(): Promise<PsyDashboard> {
  return apiFetch<PsyDashboard>('/api/psy/dashboard');
}

export async function getPsyProfile(): Promise<{
  success: boolean;
  profile: PsyProfile;
  availability: PsyAvailabilitySlot[];
  specialtyCatalog: Array<{ value: string; label: string }>;
}> {
  return apiFetch('/api/psy/profile');
}

export async function updatePsyProfile(payload: {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  country?: string | null;
  birthDate?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  specialties?: string[];
  sessionPrice?: number | null;
  currency?: string;
  isAcceptingNew?: boolean;
}): Promise<{ success: boolean; profile: PsyProfile }> {
  return apiFetch('/api/psy/profile', { method: 'PATCH', body: payload });
}

export async function updatePsyAvailability(slots: Array<{
  weekday: number;
  start: string;
  end: string;
  enabled: boolean;
}>): Promise<{ success: boolean; slots: unknown[] }> {
  return apiFetch('/api/psy/profile/availability', { method: 'PUT', body: { slots } });
}

export async function getPsyPatients(params?: {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<{ success: boolean; patients: PsyPatientSummary[]; pagination: Pagination }> {
  return apiFetch(`/api/psy/patients${query(params)}`);
}

export async function getPsyPatient(userId: string): Promise<{
  success: boolean;
  patient: PsyPatientDetail;
  appointments: PsyAppointment[];
  reports: Array<{ id: string; appointmentId: string | null; summary: string; moodScore: number | null; createdAt: string }>;
}> {
  return apiFetch(`/api/psy/patients/${userId}`);
}

export async function getPsyAppointments(params?: {
  scope?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<{ success: boolean; appointments: PsyAppointment[]; pagination: Pagination }> {
  return apiFetch(`/api/psy/appointments${query(params)}`);
}

export async function updatePsyAppointmentStatus(
  id: string,
  status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW',
  cancelReason?: string
): Promise<{ success: boolean; message: string }> {
  return apiFetch(`/api/psy/appointments/${id}/status`, {
    method: 'PATCH',
    body: { status, cancelReason },
  });
}

export async function savePsyAppointmentNote(id: string, psyNote: string): Promise<{ success: boolean }> {
  return apiFetch(`/api/psy/appointments/${id}/note`, { method: 'PATCH', body: { psyNote } });
}

export async function createPsyPatientReport(payload: {
  patientUserId: string;
  appointmentId?: string | null;
  summary: string;
  moodScore?: number | null;
}): Promise<{ success: boolean; report: { id: string } }> {
  return apiFetch('/api/psy/patients/reports', { method: 'POST', body: payload });
}

export async function getPsyWorkshops(params?: {
  search?: string;
  focusArea?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<{
  success: boolean;
  workshops: PsyWorkshop[];
  stats: { total: number; enrollments: number; occupancyRate: number; upcoming: number };
  pagination: Pagination;
}> {
  return apiFetch(`/api/psy/workshops${query(params)}`);
}

export async function getPsyWorkshop(id: string): Promise<{ success: boolean; workshop: PsyWorkshop }> {
  return apiFetch(`/api/psy/workshops/${id}`);
}

export async function createPsyWorkshop(payload: {
  title: string;
  description: string;
  coverUrl?: string | null;
  focusArea: string;
  startsAt: string;
  durationHours: number;
  capacity: number;
  priceCents: number;
  currency?: string;
}): Promise<{ success: boolean; workshop: PsyWorkshop }> {
  return apiFetch('/api/psy/workshops', { method: 'POST', body: payload });
}

export async function updatePsyWorkshop(
  id: string,
  payload: Partial<Parameters<typeof createPsyWorkshop>[0]>
): Promise<{ success: boolean; workshop: PsyWorkshop }> {
  return apiFetch(`/api/psy/workshops/${id}`, { method: 'PATCH', body: payload });
}

export async function deletePsyWorkshop(id: string): Promise<{ success: boolean; message: string }> {
  return apiFetch(`/api/psy/workshops/${id}`, { method: 'DELETE' });
}

export async function getPsyWorkshopEnrollments(id: string): Promise<{
  success: boolean;
  workshop: { id: string; title: string };
  total: number;
  attendees: Array<{ userId: string; name: string; email: string; enrolledAt: string | null }>;
}> {
  return apiFetch(`/api/psy/workshops/${id}/enrollments`);
}

export async function getPsyResources(params?: {
  type?: string;
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<{
  success: boolean;
  resources: PsyResource[];
  stats: { total: number; articles: number; pdfs: number; videos: number };
  pagination: Pagination;
}> {
  return apiFetch(`/api/psy/resources${query(params)}`);
}

export async function getPsyResource(id: string): Promise<{ success: boolean; resource: PsyResource }> {
  return apiFetch(`/api/psy/resources/${id}`);
}

export async function createPsyResource(payload: {
  type: string;
  title: string;
  description: string;
  coverUrl?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  readingMins?: number | null;
  focusArea?: string | null;
}): Promise<{ success: boolean; resource: PsyResource }> {
  return apiFetch('/api/psy/resources', { method: 'POST', body: payload });
}

export async function updatePsyResource(
  id: string,
  payload: Partial<Parameters<typeof createPsyResource>[0]>
): Promise<{ success: boolean; resource: PsyResource }> {
  return apiFetch(`/api/psy/resources/${id}`, { method: 'PATCH', body: payload });
}

export async function deletePsyResource(id: string): Promise<{ success: boolean; message: string }> {
  return apiFetch(`/api/psy/resources/${id}`, { method: 'DELETE' });
}

export async function getPsyConversations(params?: {
  filter?: string;
  search?: string;
}): Promise<{ success: boolean; conversations: PsyConversation[]; unreadTotal: number }> {
  return apiFetch(`/api/psy/conversations${query(params)}`);
}

export async function getPsyMessages(conversationId: string): Promise<{
  success: boolean;
  conversation: PsyConversation;
  messages: Array<{
    id: string;
    senderId: string;
    senderName: string;
    body: string;
    attachmentUrl: string | null;
    attachmentName: string | null;
    createdAt: string;
  }>;
}> {
  return apiFetch(`/api/psy/conversations/${conversationId}/messages`);
}

export async function sendPsyMessage(
  conversationId: string,
  body: string
): Promise<{ success: boolean; message: { id: string; createdAt: string } }> {
  return apiFetch(`/api/psy/conversations/${conversationId}/messages`, { method: 'POST', body: { body } });
}

export async function createPsyGroupConversation(
  title: string,
  participantIds: string[]
): Promise<{ success: boolean; conversation: { id: string } }> {
  return apiFetch('/api/psy/conversations', { method: 'POST', body: { title, participantIds } });
}

export async function blockPsyConversation(conversationId: string): Promise<{ success: boolean }> {
  return apiFetch(`/api/psy/conversations/${conversationId}/block`, { method: 'POST' });
}

export async function getPsyNotifications(params?: {
  filter?: string;
  page?: number;
  limit?: number;
}): Promise<{
  success: boolean;
  notifications: PsyNotification[];
  unread: number;
  pagination: Pagination;
}> {
  return apiFetch(`/api/psy/notifications${query(params)}`);
}

export async function markAllPsyNotificationsRead(): Promise<{ success: boolean; updated: number }> {
  return apiFetch('/api/psy/notifications/read-all', { method: 'POST' });
}

export async function getPsyPreferences(): Promise<{ success: boolean; preferences: PsyPreferences }> {
  return apiFetch('/api/psy/preferences');
}

export async function updatePsyPreferences(
  payload: Partial<PsyPreferences>
): Promise<{ success: boolean; preferences: PsyPreferences }> {
  return apiFetch('/api/psy/preferences', { method: 'PATCH', body: payload });
}

export async function getPsyReferrals(params?: {
  box?: string;
  page?: number;
  limit?: number;
}): Promise<{ success: boolean; referrals: PsyReferral[]; pagination: Pagination }> {
  return apiFetch(`/api/psy/referrals${query(params)}`);
}

export async function createPsyReferral(payload: {
  toPsychologistId: string;
  patientUserId: string;
  note?: string | null;
}): Promise<{ success: boolean; message: string }> {
  return apiFetch('/api/psy/referrals', { method: 'POST', body: payload });
}

export async function respondToPsyReferral(
  id: string,
  status: 'ACCEPTED' | 'DECLINED'
): Promise<{ success: boolean; message: string }> {
  return apiFetch(`/api/psy/referrals/${id}`, { method: 'PATCH', body: { status } });
}

export async function getPsyColleagues(): Promise<{
  success: boolean;
  colleagues: Array<{ id: string; name: string; specialties: string[]; rating: number }>;
}> {
  return apiFetch('/api/psy/colleagues');
}
