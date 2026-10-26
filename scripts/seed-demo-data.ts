import { createClient } from '@supabase/supabase-js';
import { PrismaClient, Role, AccountStatus, AppointmentType, AppointmentStatus, PatientLinkStatus } from '@prisma/client';

const isProd = process.env.NODE_ENV === 'production' || process.env.DEMO_SEED_PROD === 'true';
const allow = process.env.ALLOW_DEMO_SEED === 'true';

if (isProd && !allow) {
  console.error('Demo seed disabled in production. Set ALLOW_DEMO_SEED=true explicitly if authorized.');
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '';
const supabaseSecretKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY ?? '';

if (!supabaseUrl || !supabaseSecretKey) {
  console.error('Missing Supabase env vars');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseSecretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const prisma = new PrismaClient();

const PSYS = [
  { email: 'demo.psy1@kitsunova.local', first: 'Laura', last: 'Martínez', spec: ['Ansiedad', 'Terapia Cognitivo-Conductual'] },
  { email: 'demo.psy2@kitsunova.local', first: 'Carlos', last: 'Gómez', spec: ['Estrés', 'Mindfulness'] },
  { email: 'demo.psy3@kitsunova.local', first: 'María', last: 'López', spec: ['Autoestima', 'Terapia Breve'] },
  { email: 'demo.psy4@kitsunova.local', first: 'Javier', last: 'Ruiz', spec: ['Depresión', 'Activación Conductual'] },
  { email: 'demo.psy5@kitsunova.local', first: 'Ana', last: 'Torres', spec: ['Sueño', 'Regulación Emocional'] },
];

const USERS = Array.from({ length: 12 }, (_, i) => ({
  email: `demo.user${i + 1}@kitsunova.local`,
  first: `Usuario${i + 1}`,
  last: 'Demo',
}));

const ADMIN_EMAIL = 'admin@kitsunova.local';

async function ensureAuthUser(email: string, role: Role) {
  const pwd = 'DemoData123!';
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: pwd,
    user_metadata: { first_name: email.split('@')[0], role },
    app_metadata: { role },
    email_confirm: true,
  });
  if (error) {
    const msg = (error as any).message?.toLowerCase() || '';
    if (msg.includes('already') || msg.includes('duplicate')) {
      const { data: list } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      const existing = list.users.find((u) => u.email === email);
      if (!existing) throw new Error(`Not found: ${email}`);
      await supabaseAdmin.auth.admin.updateUserById(existing.id, { app_metadata: { role } });
      return existing.id;
    }
    throw error;
  }
  return data.user!.id;
}

async function main() {
  const admin = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
  if (admin) {
    console.log('Preserving existing ADMIN:', admin.email);
  } else {
    console.log('No existing ADMIN found in DB (will not create)');
  }

  const psyIds: string[] = [];
  const psyProfiles: string[] = [];
  for (const p of PSYS) {
    const uid = await ensureAuthUser(p.email, Role.PSYCHOLOGIST);
    const user = await prisma.user.upsert({
      where: { email: p.email },
      create: {
        id: uid,
        email: p.email,
        passwordHash: '',
        role: Role.PSYCHOLOGIST,
        status: AccountStatus.ACTIVE,
        profile: { create: { username: p.email.split('@')[0], firstName: p.first, lastName: p.last } },
      },
      update: {
        passwordHash: '',
        role: Role.PSYCHOLOGIST,
        status: AccountStatus.ACTIVE,
        profile: { upsert: { create: { username: p.email.split('@')[0], firstName: p.first, lastName: p.last }, update: { firstName: p.first, lastName: p.last } } },
      },
    });
    const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
    if (profile) {
      psyProfiles.push(profile.id);
      await prisma.psychologistProfile.upsert({
        where: { profileId: profile.id },
        create: { profileId: profile.id, isApproved: true, approvedAt: new Date(), specialties: p.spec },
        update: { isApproved: true, approvedAt: new Date(), specialties: p.spec },
      });
      // Availability Mon-Fri 09:00-17:00 (slots in minutes)
      const slots = [
        { weekday: 1, start: 540, end: 1020 },
        { weekday: 2, start: 540, end: 1020 },
        { weekday: 3, start: 540, end: 1020 },
        { weekday: 4, start: 540, end: 1020 },
        { weekday: 5, start: 540, end: 1020 },
      ];
      for (const s of slots) {
        const existing = await prisma.availabilitySlot.findFirst({
          where: { profileId: profile.id, weekday: s.weekday, startMinutes: s.start, endMinutes: s.end },
        });
        if (!existing) {
          await prisma.availabilitySlot.create({
            data: { profileId: profile.id, weekday: s.weekday, startMinutes: s.start, endMinutes: s.end },
          });
        }
      }
    }
    psyIds.push(user.id);
  }

  const userIds: string[] = [];
  for (const u of USERS) {
    const uid = await ensureAuthUser(u.email, Role.USER);
    const user = await prisma.user.upsert({
      where: { email: u.email },
      create: {
        id: uid,
        email: u.email,
        passwordHash: '',
        role: Role.USER,
        status: AccountStatus.ACTIVE,
        profile: { create: { username: u.email.split('@')[0], firstName: u.first, lastName: u.last } },
      },
      update: {
        passwordHash: '',
        role: Role.USER,
        status: AccountStatus.ACTIVE,
        profile: { upsert: { create: { username: u.email.split('@')[0], firstName: u.first, lastName: u.last }, update: { firstName: u.first, lastName: u.last } } },
      },
    });
    userIds.push(user.id);
  }

  // Links and appointments
  for (let i = 0; i < Math.min(8, userIds.length, psyIds.length); i++) {
    try {
      await prisma.psyPatient.upsert({
        where: { psychologistId_patientUserId: { psychologistId: psyIds[i % psyIds.length], patientUserId: userIds[i] } },
        create: { psychologistId: psyIds[i % psyIds.length], patientUserId: userIds[i], status: PatientLinkStatus.ACTIVE, startedAt: new Date() },
        update: {},
      });
    } catch (e) {
      // ignore if constraint differs
    }
    try {
      await prisma.appointment.create({
        data: {
          psychologistId: psyIds[i % psyIds.length],
          patientUserId: userIds[i],
          type: AppointmentType.FIRST_SESSION,
          status: i < 4 ? AppointmentStatus.CONFIRMED : AppointmentStatus.PENDING,
          startsAt: new Date(Date.now() + i * 86400000),
          endsAt: new Date(Date.now() + i * 86400000 + 3600000),
          reason: 'Consulta de demostración',
        },
      });
    } catch {}
  }

  // Conversations
  for (let i = 0; i < Math.min(4, userIds.length, psyIds.length); i++) {
    try {
      const conv = await prisma.conversation.create({
        data: {
          isGroup: false,
          createdById: userIds[i],
          members: {
            create: [
              { userId: userIds[i], role: Role.USER },
              { userId: psyIds[i % psyIds.length], role: Role.PSYCHOLOGIST },
            ],
          },
        },
      });
      await prisma.message.create({
        data: {
          conversationId: conv.id,
          senderId: userIds[i],
          body: 'Hola, me gustaría agendar una consulta de demostración.',
        },
      });
      await prisma.message.create({
        data: {
          conversationId: conv.id,
          senderId: psyIds[i % psyIds.length],
          body: 'Hola, con gusto te ayudo. ¿Qué día prefieres?',
        },
      });
    } catch {}
  }

  console.log('Demo data ready');
  console.log(`Psychologists: ${psyIds.length}, Users: ${userIds.length}, Availability slots added, Links/Appointments/Conversations/Messages created`);
}

main()
  .catch((e) => {
    console.error('Seed failed');
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
