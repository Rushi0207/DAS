/**
 * Database seed — Phase 2
 *
 * Seeds:
 *   1. The three system roles (Administrator, Class Advisor, Subject Teacher)
 *   2. One Administrator user from SEED_ADMIN_* env variables
 *
 * Safe to re-run (uses upsert / findFirst guards).
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// ─── Role definitions ──────────────────────────────────────────────────────

const ROLES = [
  { name: 'Administrator' },
  { name: 'Class Advisor' },
  { name: 'Subject Teacher' },
];

async function seedRoles() {
  console.log('[seed] Seeding roles...');
  for (const role of ROLES) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: { name: role.name },
    });
    console.log(`  ✓ Role: ${role.name}`);
  }
}

// ─── Admin user ────────────────────────────────────────────────────────────

async function seedAdminUser() {
  const username = process.env.SEED_ADMIN_USERNAME;
  const email    = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!username || !email || !password) {
    console.warn('[seed] SEED_ADMIN_* variables not set — skipping admin user seed.');
    return;
  }

  const adminRole = await prisma.role.findUnique({ where: { name: 'Administrator' } });
  if (!adminRole) {
    throw new Error('[seed] Administrator role not found — run role seed first.');
  }

  const existing = await prisma.user.findFirst({
    where: { OR: [{ username }, { email }] },
  });

  if (existing) {
    console.log(`[seed] Admin user already exists (username: ${existing.username}) — skipping.`);
    return;
  }

  const rounds = parseInt(process.env.BCRYPT_ROUNDS, 10) || 12;
  const passwordHash = await bcrypt.hash(password, rounds);

  const admin = await prisma.user.create({
    data: {
      username,
      email,
      passwordHash,
      isActive: true,
      roleId: adminRole.id,
    },
  });

  console.log(`[seed] ✓ Admin user created: ${admin.username} (${admin.email})`);
}

// ─── Main ──────────────────────────────────────────────────────────────────

async function main() {
  console.log('[seed] Starting database seed...');
  await seedRoles();
  await seedAdminUser();
  console.log('[seed] Done.');
}

main()
  .catch((err) => {
    console.error('[seed] Error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
