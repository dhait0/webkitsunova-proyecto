import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { createClient } from '@supabase/supabase-js';
import { PrismaClient, Role, AccountStatus } from '@prisma/client';

const supabaseUrl = process.env.SUPABASE_URL ?? '';
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY ?? '';

const supabaseAdmin = createClient(supabaseUrl, supabaseSecretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'admin@kitsunova.local';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'Admin1234!';
const ADMIN_USERNAME = process.env.SEED_ADMIN_USERNAME ?? 'admin';
const ADMIN_FIRST_NAME = process.env.SEED_ADMIN_FIRST_NAME ?? 'Admin';
const ADMIN_LAST_NAME = process.env.SEED_ADMIN_LAST_NAME ?? 'Kitsunova';

async function main() {
  let supabaseUserId: string;

  try {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      user_metadata: {
        first_name: ADMIN_FIRST_NAME,
        last_name: ADMIN_LAST_NAME,
        username: ADMIN_USERNAME,
      },
      app_metadata: { role: 'ADMIN' },
      email_confirm: true,
    });

    if (error) {
      const msg = (error as { message?: string }).message ?? '';
      if (msg.includes('already') || msg.includes('duplicate')) {
        const { data: listData } = await supabaseAdmin.auth.admin.listUsers({
          perPage: 100,
        });
        const existing = listData.users.find((u) => u.email === ADMIN_EMAIL);

        if (!existing) {
          throw new Error(`Usuario ${ADMIN_EMAIL} no encontrado en Supabase Auth`);
        }

        supabaseUserId = existing.id;
        await supabaseAdmin.auth.admin.updateUserById(supabaseUserId, {
          app_metadata: { role: 'ADMIN' },
          user_metadata: {
            first_name: ADMIN_FIRST_NAME,
            last_name: ADMIN_LAST_NAME,
            username: ADMIN_USERNAME,
          },
        });
        console.log('✓ Usuario admin actualizado en Supabase Auth');
      } else {
        throw error;
      }
    } else {
      supabaseUserId = data.user!.id;
      console.log('✓ Usuario admin creado en Supabase Auth');
    }
  } catch (err) {
    console.error('✗ Error en Supabase Auth:', err);
    throw err;
  }

  try {
    await prisma.user.upsert({
      where: { email: ADMIN_EMAIL },
      create: {
        id: supabaseUserId,
        email: ADMIN_EMAIL,
        passwordHash: '',
        role: Role.ADMIN,
        status: AccountStatus.ACTIVE,
        profile: {
          create: {
            username: ADMIN_USERNAME,
            firstName: ADMIN_FIRST_NAME,
            lastName: ADMIN_LAST_NAME,
          },
        },
      },
      update: {
        passwordHash: '',
        role: Role.ADMIN,
        status: AccountStatus.ACTIVE,
        profile: {
          upsert: {
            create: {
              username: ADMIN_USERNAME,
              firstName: ADMIN_FIRST_NAME,
              lastName: ADMIN_LAST_NAME,
            },
            update: {
              username: ADMIN_USERNAME,
              firstName: ADMIN_FIRST_NAME,
              lastName: ADMIN_LAST_NAME,
            },
          },
        },
      },
    });
    console.log('✓ Registro Prisma sincronizado');
  } catch (prismaErr) {
    console.warn('⚠ No se pudo sincronizar Prisma (base de datos no disponible):', prismaErr);
    console.warn('  El usuario admin está listo en Supabase Auth. ' +
      'Ejecuta "npm run db:push && npm run seed" cuando la base de datos esté disponible.');
  }

  console.log('');
  console.log('Admin seed completed (Supabase Auth)');
  console.log(`Email: ${ADMIN_EMAIL}`);
  console.log(`Password: ${ADMIN_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error('Seed failed');
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
