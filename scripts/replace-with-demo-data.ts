/**
 * Replaces the application data of a Supabase project with the demo scenario
 * (1 admin, 3 psychologists, 3 users and everything around them).
 *
 * It keeps the schema, migrations, RLS and Supabase configuration untouched and
 * only deletes rows: Prisma users (their rows cascade to every dependent table),
 * conversations, and Supabase Auth users. Accounts listed in DEMO_KEEP_EMAILS are
 * preserved with their data.
 *
 * DRY RUN BY DEFAULT: without --apply it only prints what would be replaced.
 *
 *   npx tsx scripts/replace-with-demo-data.ts            # inventory, changes nothing
 *   npx tsx scripts/replace-with-demo-data.ts --apply    # destructive
 *
 * Target rules live in scripts/lib/demo-target.ts: a local stack needs nothing
 * else; a remote project additionally needs DEMO_REMOTE_PROJECT_REF,
 * DEMO_REMOTE_CONFIRM, and for --apply fresh backups of the public schema
 * (DEMO_REPLACE_BACKUP) and of Auth (DEMO_REPLACE_AUTH_BACKUP).
 */
import { statSync } from 'node:fs';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';
import { resolveDemoTarget } from './lib/demo-target';
import { DEMO_ACCOUNT_EMAILS, seedDemoScenario } from './seed-demo-scenario';

const MAX_BACKUP_AGE_MS = 24 * 60 * 60 * 1000;

function requireFreshBackup(label: string, path: string | undefined) {
  if (!path) throw new Error(`Remote --apply requires ${label} (path to a fresh backup file).`);
  let stats;
  try {
    stats = statSync(path);
  } catch {
    throw new Error(`${label}: file not found.`);
  }
  if (!stats.isFile() || stats.size === 0) throw new Error(`${label}: the file is empty.`);
  if (Date.now() - stats.mtimeMs > MAX_BACKUP_AGE_MS) {
    throw new Error(`${label}: the backup is older than 24 hours; take a new one.`);
  }
}

/** Counts a table that may not exist yet (migration pending) without aborting the inventory. */
async function safeCount(count: () => Promise<number>): Promise<number | string> {
  try {
    return await count();
  } catch {
    return 'n/a (table missing)';
  }
}

type KeptFingerprint = {
  email: string;
  authId: string;
  credentialsDigest: string;
  metadataDigest: string;
  confirmed: boolean;
  banned: boolean;
  identities: number;
  mfaFactors: number;
  prismaId: string;
  role: string;
  status: string;
  profiles: number;
};

/**
 * What identifies a preserved account without exposing it: ids, digests of the
 * password hash and metadata, identity and MFA counts, and the Prisma row.
 * Taken before and after the replacement; any difference is a failure.
 */
async function fingerprintKept(prisma: PrismaClient, emails: string[]): Promise<KeptFingerprint[]> {
  const result: KeptFingerprint[] = [];
  for (const email of emails) {
    const auth = await prisma.$queryRaw<
      Array<{ id: string; cred: string; meta: string; confirmed: boolean; banned: boolean; identities: number; mfa: number }>
    >`select u.id::text as id, md5(coalesce(u.encrypted_password, '')) as cred,
             md5(coalesce(u.raw_app_meta_data::text, '')) as meta,
             u.email_confirmed_at is not null as confirmed, u.banned_until is not null as banned,
             (select count(*)::int from auth.identities i where i.user_id = u.id) as identities,
             (select count(*)::int from auth.mfa_factors f where f.user_id = u.id) as mfa
      from auth.users u where lower(u.email) = ${email}`;
    const row = await prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      select: { id: true, role: true, status: true, _count: { select: { habits: true } } },
    });
    const profiles = row ? await prisma.profile.count({ where: { userId: row.id } }) : 0;

    if (auth.length !== 1) throw new Error(`Preserved account ${email}: expected exactly one Auth user, found ${auth.length}.`);
    if (!row) throw new Error(`Preserved account ${email}: no Prisma row.`);
    if (row.id !== auth[0].id) throw new Error(`Preserved account ${email}: Auth and Prisma ids differ.`);
    if (row.status !== 'ACTIVE') throw new Error(`Preserved account ${email} is not ACTIVE.`);

    result.push({
      email,
      authId: auth[0].id,
      credentialsDigest: auth[0].cred,
      metadataDigest: auth[0].meta,
      confirmed: auth[0].confirmed,
      banned: auth[0].banned,
      identities: auth[0].identities,
      mfaFactors: auth[0].mfa,
      prismaId: row.id,
      role: row.role,
      status: row.status,
      profiles,
    });
  }
  return result;
}

async function listAuthUsers(admin: SupabaseClient) {
  const users: Array<{ id: string; email: string | null }> = [];
  for (let page = 1; ; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    users.push(...data.users.map((u) => ({ id: u.id, email: u.email?.toLowerCase() ?? null })));
    if (data.users.length < 200) return users;
  }
}

async function main() {
  const apply = process.argv.includes('--apply');
  const target = resolveDemoTarget({ allowRemote: true });
  const keep = new Set(
    (process.env.DEMO_KEEP_EMAILS ?? '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );

  const clash = DEMO_ACCOUNT_EMAILS.filter((email) => keep.has(email));
  if (clash.length > 0) {
    throw new Error(`DEMO_KEEP_EMAILS cannot include demo accounts: ${clash.join(', ')}`);
  }

  const admin = createClient(target.supabaseUrl, target.serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const prisma = new PrismaClient();

  try {
    console.log(
      `Target: ${target.remote ? `REMOTE project ${target.projectRef}` : 'local stack'} · mode: ${apply ? 'APPLY' : 'dry run'}`,
    );

    const [users, authUsers] = await Promise.all([
      prisma.user.findMany({ select: { id: true, email: true, role: true, status: true } }),
      listAuthUsers(admin),
    ]);

    const replacedUsers = users.filter((u) => !keep.has(u.email.toLowerCase()));
    const keptUsers = users.filter((u) => keep.has(u.email.toLowerCase()));
    const prismaIds = new Set(users.map((u) => u.id));
    const replacedAuth = authUsers.filter((u) => !(u.email && keep.has(u.email)));
    const orphanAuth = replacedAuth.filter((u) => !prismaIds.has(u.id));

    const byRole = (list: typeof users) =>
      ['ADMIN', 'PSYCHOLOGIST', 'USER'].map((r) => `${r}=${list.filter((u) => u.role === r).length}`).join(' ');

    const tables = {
      Appointments: await prisma.appointment.count(),
      Availability: await prisma.availabilitySlot.count(),
      PsyPatients: await prisma.psyPatient.count(),
      Conversations: await prisma.conversation.count(),
      Messages: await prisma.message.count(),
      Habits: await prisma.habit.count(),
      HabitLogs: await safeCount(() => prisma.habitLog.count()),
      Workshops: await prisma.workshop.count(),
      Enrollments: await prisma.workshopEnrollment.count(),
      Resources: await prisma.resource.count(),
      Reviews: await prisma.review.count(),
      Reports: await prisma.patientReport.count(),
      Referrals: await prisma.psyReferral.count(),
      Notifications: await prisma.notification.count(),
    };

    console.log('\nInventory (public + Auth):');
    console.log(`  Prisma users: ${users.length} (${byRole(users)})`);
    console.log(`  Auth users:   ${authUsers.length} (${orphanAuth.length} without a Prisma row)`);
    console.log(`  Preserved:    ${keptUsers.length} user(s) from DEMO_KEEP_EMAILS`);
    console.log(`  Replaced:     ${replacedUsers.length} Prisma user(s) and ${replacedAuth.length} Auth user(s)`);
    console.table(tables);

    const missingKeep = [...keep].filter((e) => !users.some((u) => u.email.toLowerCase() === e));
    if (missingKeep.length > 0) {
      console.log(`  Note: ${missingKeep.length} DEMO_KEEP_EMAILS entr(ies) match no Prisma user.`);
    }

    const keepList = [...keep];
    const before = await fingerprintKept(prisma, keepList);
    if (keepList.length > 0) {
      console.log(`\nPreserved accounts verified (Auth + Prisma, same id, ACTIVE): ${before.map((f) => `${f.email} [${f.role}, identities=${f.identities}, mfa=${f.mfaFactors}]`).join('; ')}`);
    }

    if (!apply) {
      console.log('\nDry run: nothing was changed. Re-run with --apply to replace the data.');
      return;
    }

    // --- Preconditions for a destructive run ---------------------------------
    const habitLog = await prisma.$queryRaw<Array<{ n: number }>>`
      select count(*)::int as n from information_schema.columns
      where table_schema = 'public' and (
        (table_name = 'HabitLog' and column_name = 'habitId') or
        (table_name = 'PsychologistProfile' and column_name = 'rejectedAt') or
        (table_name = 'Habit' and column_name = 'targetPerWeek'))`;
    if ((habitLog[0]?.n ?? 0) !== 3) {
      throw new Error('The habit-tracking and rejection migrations are not applied here; apply them first.');
    }

    // Never leave the project without an administrator you can sign in as.
    const keptAdmins = keptUsers.filter((u) => u.role === 'ADMIN').length;
    if (keptAdmins === 0 && process.env.DEMO_ACK_NO_PRESERVED_ADMIN !== 'yes-replace-all-admins') {
      throw new Error(
        'No ADMIN account is preserved (DEMO_KEEP_EMAILS). If you really want to replace every administrator, ' +
          'set DEMO_ACK_NO_PRESERVED_ADMIN=yes-replace-all-admins.',
      );
    }
    if (target.remote && (process.env.DEMO_PASSWORD ?? '').length < 16) {
      throw new Error('Remote --apply requires DEMO_PASSWORD with at least 16 characters.');
    }

    if (target.remote) {
      requireFreshBackup('DEMO_REPLACE_BACKUP', process.env.DEMO_REPLACE_BACKUP);
      requireFreshBackup('DEMO_REPLACE_AUTH_BACKUP', process.env.DEMO_REPLACE_AUTH_BACKUP);
    }

    // --- Replace -------------------------------------------------------------
    // Conversations are not tied to a user by a foreign key; drop every one
    // whose members are all being replaced (members and messages cascade).
    const keptIds = keptUsers.map((u) => u.id);
    const conversations = await prisma.conversation.deleteMany({
      where: keptIds.length > 0 ? { members: { none: { userId: { in: keptIds } } } } : {},
    });

    // Every other table hangs off User with ON DELETE CASCADE.
    const removedUsers = await prisma.user.deleteMany({
      where: { id: { notIn: keptIds } },
    });

    let removedAuth = 0;
    for (const user of replacedAuth) {
      const { error } = await admin.auth.admin.deleteUser(user.id);
      if (error && !/not found/i.test(error.message)) throw error;
      removedAuth += 1;
    }
    console.log(
      `\nRemoved: ${removedUsers.count} Prisma user(s), ${conversations.count} conversation(s), ${removedAuth} Auth user(s).`,
    );

    let seeded: Awaited<ReturnType<typeof seedDemoScenario>>;
    try {
      seeded = await seedDemoScenario(target, process.env.DEMO_PASSWORD);
    } catch (error) {
      console.error(
        '\nSEEDING FAILED AFTER THE DELETION. The previous data is gone from this project: restore it from the ' +
          'backups with the recovery steps in contexto/planificacion/PROD_REEMPLAZO_DEMO_RUNBOOK.md (section 3), ' +
          'or re-run this script, which is idempotent.',
      );
      throw error;
    }

    // --- Post-checks ---------------------------------------------------------
    const publishableKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
    console.log('\nLogin check:');
    let failedLogins = 0;
    for (const email of DEMO_ACCOUNT_EMAILS) {
      if (!publishableKey) {
        console.log(`  ${email}: skipped (no publishable key in the environment)`);
        continue;
      }
      const client = createClient(target.supabaseUrl, publishableKey, { auth: { persistSession: false } });
      const { error } = await client.auth.signInWithPassword({ email, password: seeded.password });
      if (error) failedLogins += 1;
      console.log(`  ${email}: ${error ? `FAILED (${error.message})` : 'ok'}`);
    }
    const after = await fingerprintKept(prisma, keepList);
    const unchanged = JSON.stringify(before) === JSON.stringify(after);
    console.log(`\nPreserved accounts unchanged (ids, credentials digest, role/metadata, identities, MFA, Prisma row): ${unchanged ? 'yes' : 'NO'}`);
    if (!unchanged) {
      process.exitCode = 1;
      console.error('A preserved account changed during the replacement. Stop and restore from the backups.');
    }

    if (failedLogins > 0) {
      process.exitCode = 1;
      console.error(`\n${failedLogins} demo account(s) cannot sign in. Do not close the session: investigate or restore.`);
    }

    if (seeded.generated) {
      console.log(`\nGenerated password for the seven demo accounts (shown once): ${seeded.password}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Replacement failed');
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
