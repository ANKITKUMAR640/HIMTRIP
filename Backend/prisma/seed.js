import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
try {
  const email = (process.env.ADMIN_EMAIL || 'mkankit2613@gmail.com').trim().toLowerCase();
  const password = process.env.ADMIN_INITIAL_PASSWORD;
  const name = process.env.ADMIN_NAME || 'Himtrip Admin';
  if (!password || password.startsWith('CHANGE_ME') || password.length < 12) {
    throw new Error('Set ADMIN_INITIAL_PASSWORD in .env to a unique password of at least 12 characters before seeding.');
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const admin = await prisma.user.upsert({ where: { email }, update: { name, passwordHash, role: 'ADMIN' }, create: { name, email, passwordHash, role: 'ADMIN' } });
  console.log(`Admin account ready: ${admin.email}`);
  console.log('For security, do not commit .env or share the initial password. Change it after first sign-in by adding a password-change workflow before production launch.');
} finally { await prisma.$disconnect(); }
