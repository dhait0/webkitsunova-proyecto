import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient, Role, AccountStatus } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const seedSchema = z.object({
  SEED_ADMIN_EMAIL: z.string().email().default('admin@kitsunova.local'),
  SEED_ADMIN_PASSWORD: z.string().min(8).default('Admin1234!'),
  SEED_ADMIN_USERNAME: z.string().min(3).default('admin'),
  SEED_ADMIN_FIRST_NAME: z.string().min(1).default('Admin'),
  SEED_ADMIN_LAST_NAME: z.string().min(1).default('Kitsunova')
});

async function main() {
  const seedEnv = seedSchema.parse(process.env);
  const passwordHash = await bcrypt.hash(seedEnv.SEED_ADMIN_PASSWORD, 12);

  const user = await prisma.user.upsert({
    where: {
      email: seedEnv.SEED_ADMIN_EMAIL
    },
    create: {
      email: seedEnv.SEED_ADMIN_EMAIL,
      passwordHash,
      role: Role.ADMIN,
      status: AccountStatus.ACTIVE,
      profile: {
        create: {
          username: seedEnv.SEED_ADMIN_USERNAME,
          firstName: seedEnv.SEED_ADMIN_FIRST_NAME,
          lastName: seedEnv.SEED_ADMIN_LAST_NAME
        }
      }
    },
    update: {
      passwordHash,
      role: Role.ADMIN,
      status: AccountStatus.ACTIVE,
      profile: {
        upsert: {
          create: {
            username: seedEnv.SEED_ADMIN_USERNAME,
            firstName: seedEnv.SEED_ADMIN_FIRST_NAME,
            lastName: seedEnv.SEED_ADMIN_LAST_NAME
          },
          update: {
            username: seedEnv.SEED_ADMIN_USERNAME,
            firstName: seedEnv.SEED_ADMIN_FIRST_NAME,
            lastName: seedEnv.SEED_ADMIN_LAST_NAME
          }
        }
      }
    },
    include: {
      profile: true
    }
  });

  console.log('Admin seed completed (LEGACY AUTH)');
  console.log(`Email: ${user.email}`);
  console.log(`Password: ${seedEnv.SEED_ADMIN_PASSWORD}`);
  console.log('');
  console.log('LEGACY AUTH MIGRATION REQUIRED');
  console.log('Este usuario usa passwordHash legacy. Para Supabase Auth:');
  console.log('1. Crea el usuario en Supabase Dashboard → Authentication → Add user');
  console.log(`   Email: ${seedEnv.SEED_ADMIN_EMAIL}`);
  console.log('2. Asigna app_metadata.role = "ADMIN" al usuario');
  console.log('3. Elimina este seed cuando la migración esté completa');
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
