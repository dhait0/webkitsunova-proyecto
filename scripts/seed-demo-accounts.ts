import { createClient } from '@supabase/supabase-js';
import { PrismaClient, Role, AccountStatus } from '@prisma/client';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '';
const supabaseSecretKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY ?? '';

if (!supabaseUrl || !supabaseSecretKey) {
  console.error('Missing Supabase local env vars');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseSecretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const prisma = new PrismaClient();

const ACCOUNTS = [
  {
    email: 'user.demo@kitsunova.local',
    password: 'DemoUser123!',
    role: Role.USER,
    firstName: 'Usuario',
    lastName: 'Demo',
    username: 'user.demo',
  },
  {
    email: 'psy.demo@kitsunova.local',
    password: 'DemoPsy123!',
    role: Role.PSYCHOLOGIST,
    firstName: 'Psicóloga',
    lastName: 'Demo',
    username: 'psy.demo',
  },
  {
    email: 'admin.demo@kitsunova.local',
    password: 'DemoAdmin123!',
    role: Role.ADMIN,
    firstName: 'Admin',
    lastName: 'Demo',
    username: 'admin.demo',
  },
] as const;

async function ensureUser(account: (typeof ACCOUNTS)[number]) {
  let userId: string;
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: account.email,
    password: account.password,
    user_metadata: { first_name: account.firstName, last_name: account.lastName, username: account.username },
    app_metadata: { role: account.role },
    email_confirm: true,
  });

  if (error) {
    const msg = (error as { message?: string }).message ?? '';
    if (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('duplicate')) {
      const { data: list } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      const existing = list.users.find((u) => u.email === account.email);
      if (!existing) throw new Error(`User not found in Auth: ${account.email}`);
      userId = existing.id;
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        app_metadata: { role: account.role },
        user_metadata: { first_name: account.firstName, last_name: account.lastName, username: account.username },
      });
    } else {
      throw error;
    }
  } else {
    userId = data.user!.id;
  }

  const base = {
    email: account.email,
    passwordHash: '',
    role: account.role,
    status: AccountStatus.ACTIVE,
  };

  if (account.role === Role.PSYCHOLOGIST) {
    const user = await prisma.user.upsert({
      where: { email: account.email },
      create: {
        id: userId,
        ...base,
        profile: { create: { username: account.username, firstName: account.firstName, lastName: account.lastName } },
      },
      update: {
        passwordHash: '',
        role: account.role,
        status: AccountStatus.ACTIVE,
        profile: { upsert: { create: { username: account.username, firstName: account.firstName, lastName: account.lastName }, update: { username: account.username, firstName: account.firstName, lastName: account.lastName } } },
      },
    });
    const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
    if (profile) {
      await prisma.psychologistProfile.upsert({
        where: { profileId: profile.id },
        create: {
          profileId: profile.id,
          isApproved: true,
          approvedAt: new Date(),
          specialties: ['Terapia Cognitivo-Conductual'],
        },
        update: {
          isApproved: true,
          approvedAt: new Date(),
          specialties: ['Terapia Cognitivo-Conductual'],
        },
      });
    }
  } else {
    await prisma.user.upsert({
      where: { email: account.email },
      create: {
        id: userId,
        ...base,
        profile: { create: { username: account.username, firstName: account.firstName, lastName: account.lastName } },
      },
      update: {
        passwordHash: '',
        role: account.role,
        status: AccountStatus.ACTIVE,
        profile: { upsert: { create: { username: account.username, firstName: account.firstName, lastName: account.lastName }, update: { username: account.username, firstName: account.firstName, lastName: account.lastName } } },
      },
    });
  }
}

async function main() {
  for (const account of ACCOUNTS) {
    await ensureUser(account);
  }
  console.log('Demo accounts ready');
}

main()
  .catch((e) => {
    console.error('Demo seed failed');
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
