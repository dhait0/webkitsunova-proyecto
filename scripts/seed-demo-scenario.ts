/**
 * Demo scenario for the Sprint 1 features: 1 administrator, 3 psychologists and
 * 3 users, each present in Supabase Auth and in Prisma with the same id, role,
 * status and profile, plus appointments, conversations, habits, workshops,
 * reviews, reports and notifications that make every dashboard show data.
 *
 * Run directly it is local only: it refuses unless both the Supabase API and the
 * database resolve to this machine. A remote project can only be seeded through
 * scripts/replace-with-demo-data.ts, which adds its own confirmations.
 * Idempotent: every row has a deterministic id or natural key, so running it
 * again updates in place and shifts the dates relative to "today".
 *
 *   DEMO_PASSWORD='...' npx tsx scripts/seed-demo-scenario.ts
 *
 * Without DEMO_PASSWORD a random one is generated and printed once. No password
 * is stored in the repository.
 */
import { randomBytes } from 'node:crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  AccountStatus,
  AppointmentStatus,
  AppointmentType,
  ContentStatus,
  FocusArea,
  PatientLinkStatus,
  PrismaClient,
  ReferralStatus,
  ResourceType,
  Role,
} from '@prisma/client';
import { fitsAvailability } from '../services/psy/availability';
import { resolveDemoTarget, type DemoTarget } from './lib/demo-target';

let supabaseAdmin: SupabaseClient;
let prisma: PrismaClient;
let PASSWORD = '';
let generatedPassword = false;

function initSeed(target: DemoTarget, password?: string) {
  supabaseAdmin = createClient(target.supabaseUrl, target.serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  prisma = new PrismaClient();
  generatedPassword = !password;
  PASSWORD = password ?? `Demo-${randomBytes(9).toString('base64url')}`;
}

// --- Time helpers ---------------------------------------------------------
// Availability is interpreted in America/Bogota (UTC-5, no daylight saving).

const TZ = 'America/Bogota';
const BOGOTA_OFFSET_HOURS = 5;
const HOUR_MS = 3_600_000;
const MIN_MS = 60_000;
const DAY_MS = 24 * HOUR_MS;

/** Midnight (Bogotá calendar) of today, expressed as a UTC date holding Bogotá fields. */
function bogotaToday(): Date {
  const shifted = new Date(Date.now() - BOGOTA_OFFSET_HOURS * HOUR_MS);
  return new Date(Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate()));
}

const isWeekday = (date: Date) => date.getUTCDay() >= 1 && date.getUTCDay() <= 5;

/** Moves `offset` working days from today (negative = past), skipping weekends. */
function workingDay(offset: number): Date {
  const date = bogotaToday();
  let remaining = Math.abs(offset);
  const step = offset < 0 ? -1 : 1;
  while (remaining > 0) {
    date.setUTCDate(date.getUTCDate() + step);
    if (isWeekday(date)) remaining -= 1;
  }
  return date;
}

/** Real instant of `hour:minute` Bogotá time on a Bogotá calendar day. */
function atBogota(day: Date, hour: number, minute = 0): Date {
  return new Date(day.getTime() + (hour + BOGOTA_OFFSET_HOURS) * HOUR_MS + minute * MIN_MS);
}

const ago = (minutes: number) => new Date(Date.now() - minutes * MIN_MS);
const inDays = (days: number) => new Date(Date.now() + days * DAY_MS);

// --- Scenario definition --------------------------------------------------

type PersonKey = 'admin' | 'laura' | 'carlos' | 'maria' | 'ana' | 'diego' | 'sofia';

type Person = {
  key: PersonKey;
  email: string;
  role: Role;
  firstName: string;
  lastName: string;
  username: string;
  phone: string;
  birthDate?: string;
};

const PEOPLE: Person[] = [
  { key: 'admin', email: 'admin.demo@kitsunova.local', role: Role.ADMIN, firstName: 'Admin', lastName: 'Demo', username: 'admin.demo', phone: '+57 300 000 0001' },
  { key: 'laura', email: 'psy.laura@kitsunova.local', role: Role.PSYCHOLOGIST, firstName: 'Laura', lastName: 'Martínez', username: 'laura.martinez', phone: '+57 300 000 0011' },
  { key: 'carlos', email: 'psy.carlos@kitsunova.local', role: Role.PSYCHOLOGIST, firstName: 'Carlos', lastName: 'Gómez', username: 'carlos.gomez', phone: '+57 300 000 0012' },
  { key: 'maria', email: 'psy.maria@kitsunova.local', role: Role.PSYCHOLOGIST, firstName: 'María', lastName: 'López', username: 'maria.lopez', phone: '+57 300 000 0013' },
  { key: 'ana', email: 'user.ana@kitsunova.local', role: Role.USER, firstName: 'Ana', lastName: 'Rojas', username: 'ana.rojas', phone: '+57 300 000 0021', birthDate: '1994-03-12' },
  { key: 'diego', email: 'user.diego@kitsunova.local', role: Role.USER, firstName: 'Diego', lastName: 'Herrera', username: 'diego.herrera', phone: '+57 300 000 0022', birthDate: '1989-07-30' },
  { key: 'sofia', email: 'user.sofia@kitsunova.local', role: Role.USER, firstName: 'Sofía', lastName: 'Vargas', username: 'sofia.vargas', phone: '+57 300 000 0023', birthDate: '1998-11-04' },
];

type PsyKey = 'laura' | 'carlos' | 'maria';
type UserKey = 'ana' | 'diego' | 'sofia';

const PSY_PROFILE: Record<
  PsyKey,
  { bio: string; specialties: string[]; price: number; windows: Array<[number, number]> }
> = {
  laura: {
    bio: 'Psicóloga clínica con enfoque cognitivo-conductual. Acompaño procesos de ansiedad y estrés laboral con herramientas prácticas.',
    specialties: ['Ansiedad', 'Terapia Cognitivo-Conductual', 'Estrés'],
    price: 90000,
    windows: [[9 * 60, 17 * 60]],
  },
  carlos: {
    bio: 'Psicólogo especializado en mindfulness y regulación emocional. Trabajo con personas que buscan equilibrio en su rutina.',
    specialties: ['Mindfulness', 'Regulación Emocional', 'Depresión'],
    price: 85000,
    windows: [[10 * 60, 18 * 60]],
  },
  maria: {
    bio: 'Psicóloga de terapia breve centrada en autoestima y relaciones. Sesiones cortas, objetivos claros.',
    specialties: ['Autoestima', 'Terapia Breve', 'Relaciones'],
    price: 80000,
    windows: [[8 * 60, 14 * 60]],
  },
};

/** Weekday 1..5 windows per psychologist. */
const AVAILABILITY = (psy: PsyKey) =>
  [1, 2, 3, 4, 5].flatMap((weekday) =>
    PSY_PROFILE[psy].windows.map(([startMinutes, endMinutes]) => ({ weekday, startMinutes, endMinutes })),
  );

type AppointmentSeed = {
  n: number;
  psy: PsyKey;
  user: UserKey;
  type: AppointmentType;
  status: AppointmentStatus;
  day: number;
  hour: number;
  minutes?: number;
  reason: string;
  psyNote?: string;
  cancelReason?: string;
};

const A = AppointmentStatus;
const T = AppointmentType;

const APPOINTMENTS: AppointmentSeed[] = [
  { n: 1, psy: 'laura', user: 'ana', type: T.FIRST_SESSION, status: A.COMPLETED, day: -10, hour: 10, reason: 'Ansiedad en el trabajo', psyNote: 'Primera evaluación; se acuerdan ejercicios de respiración.' },
  { n: 2, psy: 'laura', user: 'ana', type: T.FOLLOW_UP, status: A.COMPLETED, day: -3, hour: 10, reason: 'Seguimiento de ejercicios', psyNote: 'Mejora en la conciliación del sueño.' },
  { n: 3, psy: 'laura', user: 'ana', type: T.FOLLOW_UP, status: A.CONFIRMED, day: 2, hour: 10, reason: 'Seguimiento semanal' },
  { n: 4, psy: 'carlos', user: 'diego', type: T.FIRST_SESSION, status: A.COMPLETED, day: -8, hour: 11, reason: 'Estrés y falta de descanso', psyNote: 'Se introduce práctica de atención plena de 10 minutos.' },
  { n: 5, psy: 'carlos', user: 'diego', type: T.FOLLOW_UP, status: A.CONFIRMED, day: 1, hour: 11, reason: 'Revisión de la práctica diaria' },
  { n: 6, psy: 'carlos', user: 'diego', type: T.FOLLOW_UP, status: A.PENDING, day: 6, hour: 15, reason: 'Solicita una sesión adicional' },
  { n: 7, psy: 'maria', user: 'sofia', type: T.FIRST_SESSION, status: A.COMPLETED, day: -6, hour: 9, reason: 'Autoestima y límites', psyNote: 'Se trabaja la identificación de pensamientos automáticos.' },
  { n: 8, psy: 'maria', user: 'sofia', type: T.FOLLOW_UP, status: A.CONFIRMED, day: 3, hour: 9, reason: 'Seguimiento de objetivos' },
  { n: 9, psy: 'maria', user: 'sofia', type: T.FOLLOW_UP, status: A.NO_SHOW, day: -2, hour: 12, reason: 'Seguimiento', psyNote: 'No asistió; se le escribió para reprogramar.' },
  { n: 10, psy: 'carlos', user: 'ana', type: T.FIRST_SESSION, status: A.CANCELLED, day: -12, hour: 14, reason: 'Primera consulta', cancelReason: 'Cambio de horario laboral.' },
  { n: 11, psy: 'laura', user: 'diego', type: T.FIRST_SESSION, status: A.PENDING, day: 4, hour: 16, reason: 'Segunda opinión sobre ansiedad' },
  { n: 12, psy: 'maria', user: 'ana', type: T.URGENT, status: A.PENDING, day: 5, hour: 13, minutes: 45, reason: 'Necesito hablar pronto' },
];

const ACTIVE_LINK: Record<UserKey, PsyKey> = { ana: 'laura', diego: 'carlos', sofia: 'maria' };

// --- Helpers --------------------------------------------------------------

const ids = new Map<PersonKey, string>();
const idOf = (key: PersonKey): string => {
  const id = ids.get(key);
  if (!id) throw new Error(`Missing id for ${key}`);
  return id;
};

async function ensureAuthUser(person: Person): Promise<string> {
  const metadata = {
    first_name: person.firstName,
    last_name: person.lastName,
    username: person.username,
  };

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: person.email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: metadata,
    app_metadata: { role: person.role },
  });

  if (!error) return data.user.id;

  const { data: list, error: listError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
  if (listError) throw listError;

  const existing = list.users.find((u) => u.email === person.email);
  if (!existing) throw error;

  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(existing.id, {
    password: PASSWORD,
    email_confirm: true,
    user_metadata: metadata,
    app_metadata: { role: person.role },
  });
  if (updateError) throw updateError;

  return existing.id;
}

async function seedAccounts() {
  for (const person of PEOPLE) {
    const id = await ensureAuthUser(person);
    ids.set(person.key, id);

    const profileData = {
      username: person.username,
      firstName: person.firstName,
      lastName: person.lastName,
      phone: person.phone,
      country: 'Colombia',
      timezone: TZ,
      birthDate: person.birthDate ? new Date(`${person.birthDate}T00:00:00Z`) : null,
      bio: person.role === Role.PSYCHOLOGIST ? PSY_PROFILE[person.key as PsyKey].bio : null,
    };

    const user = await prisma.user.upsert({
      where: { id },
      create: {
        id,
        email: person.email,
        passwordHash: '',
        role: person.role,
        status: AccountStatus.ACTIVE,
        profile: { create: profileData },
      },
      update: {
        email: person.email,
        role: person.role,
        status: AccountStatus.ACTIVE,
        profile: { upsert: { create: profileData, update: profileData } },
      },
      include: { profile: true },
    });

    await prisma.notificationPreference.upsert({
      where: { userId: id },
      create: { userId: id },
      update: {},
    });

    if (person.role === Role.PSYCHOLOGIST && user.profile) {
      const psy = PSY_PROFILE[person.key as PsyKey];
      const profileId = user.profile.id;

      await prisma.psychologistProfile.upsert({
        where: { profileId },
        create: {
          profileId,
          specialties: psy.specialties,
          sessionPrice: psy.price,
          currency: 'COP',
          isApproved: true,
          isVerified: true,
          isAcceptingNew: true,
          approvedAt: new Date(),
          approvedBy: idOf('admin'),
        },
        update: {
          specialties: psy.specialties,
          sessionPrice: psy.price,
          isApproved: true,
          isVerified: true,
          isAcceptingNew: true,
        },
      });

      await prisma.availabilitySlot.deleteMany({ where: { profileId } });
      await prisma.availabilitySlot.createMany({
        data: AVAILABILITY(person.key as PsyKey).map((slot) => ({ profileId, ...slot })),
      });
    }
  }
}

async function seedAppointments() {
  const resolved = APPOINTMENTS.map((a) => {
    const startsAt = atBogota(workingDay(a.day), a.hour);
    const duration = a.minutes ?? 60;
    return { ...a, startsAt, endsAt: new Date(startsAt.getTime() + duration * MIN_MS), duration };
  });

  // A session scheduled for today, only when it still lies ahead.
  const today = bogotaToday();
  const bogotaHour = new Date(Date.now() - BOGOTA_OFFSET_HOURS * HOUR_MS).getUTCHours();
  if (isWeekday(today) && bogotaHour < 14) {
    const startsAt = atBogota(today, 16);
    resolved.push({
      n: 13, psy: 'carlos', user: 'sofia', type: T.FOLLOW_UP, status: A.CONFIRMED, day: 0, hour: 16,
      reason: 'Sesión de hoy', startsAt, endsAt: new Date(startsAt.getTime() + HOUR_MS), duration: 60,
    });
  }

  // Business rules the seed must respect: slot inside availability, no overlap.
  const byPsy = new Map<PsyKey, typeof resolved>();
  for (const a of resolved) {
    const windows = AVAILABILITY(a.psy);
    if (!fitsAvailability(windows, a.startsAt, a.duration, TZ)) {
      throw new Error(`Appointment ${a.n} is outside ${a.psy}'s availability`);
    }
    byPsy.set(a.psy, [...(byPsy.get(a.psy) ?? []), a]);
  }
  for (const [psy, list] of byPsy) {
    const live = list.filter((a) => a.status !== A.CANCELLED);
    for (const a of live) {
      for (const b of live) {
        if (a.n < b.n && a.startsAt < b.endsAt && b.startsAt < a.endsAt) {
          throw new Error(`Appointments ${a.n} and ${b.n} overlap for ${psy}`);
        }
      }
    }
  }

  for (const a of resolved) {
    const data = {
      psychologistId: idOf(a.psy),
      patientUserId: idOf(a.user),
      type: a.type,
      status: a.status,
      startsAt: a.startsAt,
      endsAt: a.endsAt,
      reason: a.reason,
      psyNote: a.psyNote ?? null,
      cancelReason: a.cancelReason ?? null,
    };
    await prisma.appointment.upsert({
      where: { id: `demo-appt-${String(a.n).padStart(2, '0')}` },
      create: { id: `demo-appt-${String(a.n).padStart(2, '0')}`, ...data },
      update: data,
    });
  }

  return resolved;
}

async function seedLinks() {
  for (const [user, psy] of Object.entries(ACTIVE_LINK) as Array<[UserKey, PsyKey]>) {
    const key = { psychologistId_patientUserId: { psychologistId: idOf(psy), patientUserId: idOf(user) } };
    await prisma.psyPatient.upsert({
      where: key,
      create: { psychologistId: idOf(psy), patientUserId: idOf(user), status: PatientLinkStatus.ACTIVE, startedAt: ago(60 * 24 * 12) },
      update: { status: PatientLinkStatus.ACTIVE, endedAt: null },
    });
  }

  // Ana tried Carlos first and then moved to Laura: one ACTIVE link per user.
  const ended = { psychologistId_patientUserId: { psychologistId: idOf('carlos'), patientUserId: idOf('ana') } };
  await prisma.psyPatient.upsert({
    where: ended,
    create: { psychologistId: idOf('carlos'), patientUserId: idOf('ana'), status: PatientLinkStatus.ENDED, startedAt: ago(60 * 24 * 14), endedAt: ago(60 * 24 * 11) },
    update: { status: PatientLinkStatus.ENDED },
  });
}

const REPORTS: Array<{ appt: number; mood: number; summary: string }> = [
  { appt: 1, mood: 5, summary: 'Primera sesión: se identifican desencadenantes de ansiedad en reuniones. Plan de respiración y registro de situaciones.' },
  { appt: 2, mood: 7, summary: 'Avance en el control de la ansiedad anticipatoria; duerme mejor. Se mantiene el registro semanal.' },
  { appt: 4, mood: 6, summary: 'Se evalúa carga de estrés y descanso. Se propone práctica diaria de mindfulness de 10 minutos.' },
  { appt: 7, mood: 6, summary: 'Se exploran pensamientos automáticos sobre el desempeño. Tarea: tres logros diarios.' },
];

async function seedReportsAndReviews() {
  for (const r of REPORTS) {
    const appt = APPOINTMENTS.find((a) => a.n === r.appt)!;
    await prisma.patientReport.upsert({
      where: { id: `demo-report-${r.appt}` },
      create: { id: `demo-report-${r.appt}`, psychologistId: idOf(appt.psy), patientUserId: idOf(appt.user), appointmentId: `demo-appt-${String(r.appt).padStart(2, '0')}`, summary: r.summary, moodScore: r.mood },
      update: { summary: r.summary, moodScore: r.mood },
    });
  }

  const reviews: Array<{ user: UserKey; psy: PsyKey; rating: number; comment: string }> = [
    { user: 'ana', psy: 'laura', rating: 5, comment: 'Muy clara y cercana; los ejercicios me sirvieron desde la primera semana.' },
    { user: 'diego', psy: 'carlos', rating: 4, comment: 'Buen acompañamiento y herramientas prácticas.' },
    { user: 'sofia', psy: 'maria', rating: 5, comment: 'Sesiones enfocadas y con objetivos claros.' },
  ];
  for (const r of reviews) {
    await prisma.review.upsert({
      where: { psyId_userId: { psyId: idOf(r.psy), userId: idOf(r.user) } },
      create: { psyId: idOf(r.psy), userId: idOf(r.user), rating: r.rating, comment: r.comment },
      update: { rating: r.rating, comment: r.comment },
    });
  }

  // Keep the denormalised counters on the profile consistent with the rows.
  for (const psy of ['laura', 'carlos', 'maria'] as PsyKey[]) {
    const stats = await prisma.review.aggregate({ where: { psyId: idOf(psy) }, _avg: { rating: true }, _count: true });
    const patients = await prisma.psyPatient.count({ where: { psychologistId: idOf(psy), status: PatientLinkStatus.ACTIVE } });
    const profile = await prisma.profile.findUnique({ where: { userId: idOf(psy) } });
    await prisma.psychologistProfile.update({
      where: { profileId: profile!.id },
      data: { rating: stats._avg.rating ?? 0, reviewsCount: stats._count, patientsCount: patients },
    });
  }
}

async function seedConversations() {
  type Msg = { from: 'user' | 'psy'; text: string; minutesAgo: number };
  const conversations: Array<{ n: number; user: UserKey; psy: PsyKey; unreadFor: 'user' | 'psy' | null; messages: Msg[] }> = [
    {
      n: 1, user: 'ana', psy: 'laura', unreadFor: 'user',
      messages: [
        { from: 'user', text: 'Hola Laura, ¿podemos confirmar la sesión de la próxima semana?', minutesAgo: 3000 },
        { from: 'psy', text: 'Hola Ana, claro. Quedó confirmada en tu agenda.', minutesAgo: 2950 },
        { from: 'user', text: 'Perfecto. Estuve haciendo los ejercicios de respiración.', minutesAgo: 1500 },
        { from: 'psy', text: 'Excelente, cuéntame cómo te fue en la sesión de hoy.', minutesAgo: 90 },
      ],
    },
    {
      n: 2, user: 'diego', psy: 'carlos', unreadFor: null,
      messages: [
        { from: 'user', text: 'Hola Carlos, ¿hay disponibilidad para una sesión adicional?', minutesAgo: 2000 },
        { from: 'psy', text: 'Hola Diego, te dejo una solicitud en el calendario para que la apruebe.', minutesAgo: 1900 },
        { from: 'user', text: 'Gracias, quedo atento.', minutesAgo: 1880 },
      ],
    },
    {
      n: 3, user: 'sofia', psy: 'maria', unreadFor: 'psy',
      messages: [
        { from: 'psy', text: 'Hola Sofía, no pudiste asistir hoy. ¿Reprogramamos?', minutesAgo: 600 },
        { from: 'user', text: 'Lo siento, tuve un imprevisto. ¿Puede ser el jueves a las 9?', minutesAgo: 45 },
      ],
    },
  ];

  for (const c of conversations) {
    const conversationId = `demo-conv-${c.n}`;
    const last = c.messages.reduce((min, m) => Math.min(min, m.minutesAgo), Infinity);
    await prisma.conversation.upsert({
      where: { id: conversationId },
      create: { id: conversationId, isGroup: false, createdById: idOf(c.user) },
      update: {},
    });

    const members: Array<[string, Role, 'user' | 'psy']> = [
      [idOf(c.user), Role.USER, 'user'],
      [idOf(c.psy), Role.PSYCHOLOGIST, 'psy'],
    ];
    for (const [userId, role, side] of members) {
      const lastReadAt = c.unreadFor === side ? ago(last + 120) : ago(Math.max(last - 1, 0));
      await prisma.conversationMember.upsert({
        where: { conversationId_userId: { conversationId, userId } },
        create: { conversationId, userId, role, lastReadAt },
        update: { lastReadAt },
      });
    }

    for (const [index, m] of c.messages.entries()) {
      const id = `demo-msg-${c.n}-${index + 1}`;
      const createdAt = ago(m.minutesAgo);
      await prisma.message.upsert({
        where: { id },
        create: { id, conversationId, senderId: idOf(m.from === 'user' ? c.user : c.psy), body: m.text, createdAt },
        update: { createdAt },
      });
    }
  }
}

type HabitSeed = {
  title: string;
  description: string;
  status: 'active' | 'paused' | 'completed';
  /** Goal in days per week. */
  target: number;
  /** Share of days done before the forced run, 0..1. */
  density: number;
  /** Days in the current run (ending today when `today` is true, else yesterday). */
  run: number;
  today: boolean;
};

const HABITS: Record<UserKey, HabitSeed[]> = {
  ana: [
    { title: 'Respiración 4-7-8', description: 'Cinco minutos antes de las reuniones.', status: 'active', target: 5, density: 0.7, run: 6, today: true },
    { title: 'Caminar 20 minutos', description: 'Después del almuerzo.', status: 'active', target: 3, density: 0.5, run: 0, today: false },
    { title: 'Desconectar pantallas a las 10 pm', description: 'Rutina de sueño.', status: 'completed', target: 7, density: 0.85, run: 0, today: false },
  ],
  diego: [
    { title: 'Mindfulness 10 minutos', description: 'Al despertar.', status: 'active', target: 7, density: 0.6, run: 3, today: true },
    { title: 'Registro de estrés diario', description: 'Anotar el nivel de 1 a 10.', status: 'active', target: 5, density: 0.4, run: 2, today: false },
    { title: 'Hidratación', description: 'Ocho vasos de agua al día.', status: 'paused', target: 7, density: 0.5, run: 0, today: false },
  ],
  sofia: [
    { title: 'Tres logros diarios', description: 'Escribirlos antes de dormir.', status: 'active', target: 7, density: 0.55, run: 0, today: false },
    { title: 'Decir "no" una vez al día', description: 'Practicar límites sanos.', status: 'active', target: 3, density: 0.35, run: 0, today: false },
    { title: 'Lectura 15 minutos', description: 'Antes de dormir.', status: 'active', target: 5, density: 0.8, run: 4, today: true },
  ],
};

const HABIT_HISTORY_DAYS = 28;

/** Deterministic pseudo-random in [0, 1) so reruns produce the same pattern for the same day. */
function unit(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function dayKeyOffset(offset: number): string {
  const day = bogotaToday();
  day.setUTCDate(day.getUTCDate() + offset);
  return day.toISOString().slice(0, 10);
}

async function seedHabits() {
  for (const [user, list] of Object.entries(HABITS) as Array<[UserKey, HabitSeed[]]>) {
    for (const [index, h] of list.entries()) {
      const id = `demo-habit-${user}-${index + 1}`;
      const data = {
        userId: idOf(user),
        title: h.title,
        description: h.description,
        status: h.status,
        targetPerWeek: h.target,
        progress: 0,
      };
      await prisma.habit.upsert({ where: { id }, create: { id, ...data }, update: data });

      // Completion history: replaced on every run so it always ends today.
      await prisma.habitLog.deleteMany({ where: { habitId: id } });
      const runEnd = h.today ? 0 : -1;
      const days: string[] = [];
      for (let back = 0; back < HABIT_HISTORY_DAYS; back += 1) {
        const offset = -back;
        const inRun = h.run > 0 && offset <= runEnd && offset > runEnd - h.run;
        const brokenBefore = h.run > 0 && offset === runEnd - h.run;
        const beforeRun = h.run > 0 && offset < runEnd - h.run;
        const rolled = unit(index * 101 + user.length * 17 + back) < h.density;
        const live = h.status === 'active' || h.status === 'paused';
        // Active habits with no forced run still skip today/yesterday so a pending day exists.
        const recentGap = h.run === 0 && offset > -2 && h.status === 'active';
        if (inRun || (!brokenBefore && (h.run === 0 || beforeRun) && rolled && !recentGap && (live || offset < -3))) {
          days.push(dayKeyOffset(offset));
        }
      }
      if (days.length > 0) {
        await prisma.habitLog.createMany({
          data: days.map((date) => ({ habitId: id, userId: idOf(user), date: new Date(`${date}T00:00:00.000Z`) })),
        });
      }
    }
  }
}

async function seedWorkshopsAndResources() {
  const admin = idOf('admin');
  const workshops: Array<{
    n: number; psy: PsyKey; title: string; description: string; focus: FocusArea;
    days: number; hours: number; capacity: number; status: ContentStatus; enrolled: UserKey[];
  }> = [
    { n: 1, psy: 'laura', title: 'Manejo de la ansiedad en el trabajo', description: 'Taller práctico de técnicas de respiración y reestructuración cognitiva para entornos laborales.', focus: FocusArea.ANXIETY, days: 7, hours: 2, capacity: 20, status: ContentStatus.APPROVED, enrolled: ['ana', 'sofia'] },
    { n: 2, psy: 'carlos', title: 'Mindfulness para empezar el día', description: 'Prácticas guiadas de atención plena para construir una rutina matutina.', focus: FocusArea.MINDFULNESS, days: 10, hours: 1.5, capacity: 25, status: ContentStatus.APPROVED, enrolled: ['ana', 'diego', 'sofia'] },
    { n: 3, psy: 'maria', title: 'Autoestima y límites sanos', description: 'Ejercicios para reconocer logros y practicar la asertividad.', focus: FocusArea.SELF_ESTEEM, days: 14, hours: 2, capacity: 15, status: ContentStatus.PENDING, enrolled: [] },
  ];

  for (const w of workshops) {
    const id = `demo-workshop-${w.n}`;
    const approved = w.status === ContentStatus.APPROVED;
    const data = {
      authorId: idOf(w.psy),
      title: w.title,
      description: w.description,
      focusArea: w.focus,
      startsAt: inDays(w.days),
      durationHours: w.hours,
      capacity: w.capacity,
      priceCents: 0,
      currency: 'COP',
      status: w.status,
      reviewedAt: approved ? new Date() : null,
      reviewedById: approved ? admin : null,
    };
    await prisma.workshop.upsert({ where: { id }, create: { id, ...data }, update: data });

    for (const user of w.enrolled) {
      await prisma.workshopEnrollment.upsert({
        where: { workshopId_userId: { workshopId: id, userId: idOf(user) } },
        create: { workshopId: id, userId: idOf(user) },
        update: {},
      });
    }
  }

  const resources: Array<{ n: number; psy: PsyKey; type: ResourceType; title: string; description: string; mins: number; focus: FocusArea; status: ContentStatus }> = [
    { n: 1, psy: 'laura', type: ResourceType.ARTICLE, title: 'Guía de respiración 4-7-8', description: 'Cómo practicar la respiración 4-7-8 para bajar la activación.', mins: 5, focus: FocusArea.ANXIETY, status: ContentStatus.APPROVED },
    { n: 2, psy: 'carlos', type: ResourceType.EXERCISE, title: 'Escaneo corporal de 10 minutos', description: 'Ejercicio guiado de atención plena para relajar el cuerpo.', mins: 10, focus: FocusArea.MINDFULNESS, status: ContentStatus.APPROVED },
    { n: 3, psy: 'maria', type: ResourceType.ARTICLE, title: 'Cómo poner límites sin culpa', description: 'Pasos concretos para comunicar límites de forma asertiva.', mins: 7, focus: FocusArea.SELF_ESTEEM, status: ContentStatus.PENDING },
  ];

  for (const r of resources) {
    const id = `demo-resource-${r.n}`;
    const approved = r.status === ContentStatus.APPROVED;
    const data = {
      authorId: idOf(r.psy), type: r.type, title: r.title, description: r.description,
      readingMins: r.mins, focusArea: r.focus, status: r.status,
      reviewedAt: approved ? new Date() : null, reviewedById: approved ? admin : null,
    };
    await prisma.resource.upsert({ where: { id }, create: { id, ...data }, update: data });
  }
}

async function seedReferralAndNotifications() {
  await prisma.psyReferral.upsert({
    where: { id: 'demo-referral-1' },
    create: {
      id: 'demo-referral-1', fromPsychologistId: idOf('laura'), toPsychologistId: idOf('maria'),
      patientUserId: idOf('ana'), status: ReferralStatus.PENDING,
      note: 'Ana podría beneficiarse de un espacio breve centrado en autoestima.',
    },
    update: { status: ReferralStatus.PENDING },
  });

  const notifications: Array<{ n: number; user: PersonKey; kind: string; title: string; body: string; link: string; read: boolean }> = [
    { n: 1, user: 'ana', kind: 'appointment', title: 'Sesión confirmada', body: 'Tu próxima sesión con Laura Martínez está confirmada.', link: '/dashboard/citas', read: false },
    { n: 2, user: 'ana', kind: 'message', title: 'Nuevo mensaje', body: 'Laura Martínez te escribió.', link: '/dashboard/chats', read: false },
    { n: 3, user: 'diego', kind: 'appointment', title: 'Solicitud enviada', body: 'Tu solicitud de cita está pendiente de confirmación.', link: '/dashboard/citas', read: true },
    { n: 4, user: 'laura', kind: 'appointment', title: 'Nueva solicitud de cita', body: 'Diego Herrera solicitó una sesión.', link: '/psy/sesiones', read: false },
    { n: 5, user: 'carlos', kind: 'appointment', title: 'Nueva solicitud de cita', body: 'Tienes una solicitud de Diego Herrera.', link: '/psy/sesiones', read: false },
    { n: 6, user: 'maria', kind: 'message', title: 'Nuevo mensaje', body: 'Sofía Vargas respondió tu mensaje.', link: '/psy/mensajes', read: false },
    { n: 7, user: 'maria', kind: 'referral', title: 'Nueva derivación', body: 'Laura Martínez te derivó a un paciente.', link: '/psy/derivaciones', read: false },
  ];
  for (const n of notifications) {
    const id = `demo-notification-${n.n}`;
    const data = { userId: idOf(n.user), kind: n.kind, title: n.title, body: n.body, link: n.link, readAt: n.read ? new Date() : null };
    await prisma.notification.upsert({ where: { id }, create: { id, ...data }, update: data });
  }
}

async function summary() {
  const counts = {
    'Auth users (demo)': PEOPLE.length,
    Users: await prisma.user.count(),
    Profiles: await prisma.profile.count(),
    PsychologistProfiles: await prisma.psychologistProfile.count({ where: { isApproved: true } }),
    AvailabilitySlots: await prisma.availabilitySlot.count(),
    Appointments: await prisma.appointment.count(),
    PsyPatient: await prisma.psyPatient.count(),
    Conversations: await prisma.conversation.count(),
    Messages: await prisma.message.count(),
    Habits: await prisma.habit.count(),
    HabitLogs: await prisma.habitLog.count(),
    Workshops: await prisma.workshop.count(),
    WorkshopEnrollments: await prisma.workshopEnrollment.count(),
    Resources: await prisma.resource.count(),
    Reviews: await prisma.review.count(),
    PatientReports: await prisma.patientReport.count(),
    Referrals: await prisma.psyReferral.count(),
    Notifications: await prisma.notification.count(),
  };
  console.table(counts);
}

/**
 * Seeds the scenario into the project `target` points at. The caller is
 * responsible for having validated the target with `resolveDemoTarget`.
 * Returns the password that was set on the seven accounts.
 */
export async function seedDemoScenario(
  target: DemoTarget,
  password?: string,
): Promise<{ password: string; generated: boolean }> {
  initSeed(target, password);
  try {
    await seedAccounts();
    await seedAppointments();
    await seedLinks();
    await seedReportsAndReviews();
    await seedConversations();
    await seedHabits();
    await seedWorkshopsAndResources();
    await seedReferralAndNotifications();
    await summary();
    return { password: PASSWORD, generated: generatedPassword };
  } finally {
    await prisma.$disconnect();
  }
}

export const DEMO_ACCOUNT_EMAILS = PEOPLE.map((p) => p.email);

const isEntrypoint = /seed-demo-scenario\.[cm]?[tj]s$/.test(process.argv[1] ?? '');

if (isEntrypoint) {
  (async () => {
    const target = resolveDemoTarget({ allowRemote: false });
    const result = await seedDemoScenario(target, process.env.DEMO_PASSWORD);

    console.log('Accounts (same password for all):');
    for (const p of PEOPLE) console.log(`  ${p.role.padEnd(12)} ${p.email}`);
    if (result.generated) {
      console.log(`Generated password (shown once): ${result.password}`);
    } else {
      console.log('Password: taken from DEMO_PASSWORD.');
    }
  })().catch((error) => {
    console.error('Demo scenario seed failed');
    console.error(error);
    process.exitCode = 1;
  });
}
