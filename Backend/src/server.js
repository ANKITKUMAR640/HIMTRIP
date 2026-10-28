import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { prisma } from './db.js';
import authRoutes from './routes/auth.js';
import inquiryRoutes from './routes/inquiries.js';
import adminRoutes from './routes/admin.js';

const required = ['DATABASE_URL', 'JWT_SECRET'];
for (const key of required) if (!process.env[key]) console.warn(`[Himtrip API] ${key} is not set. Configure your .env before using database/auth features.`);
if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) console.warn('[Himtrip API] JWT_SECRET should be at least 32 characters long.');
const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
const allowedOrigins = new Set([process.env.FRONTEND_URL || 'http://localhost:5173', ...(process.env.ADDITIONAL_FRONTEND_URLS || '').split(',').map(x => x.trim()).filter(Boolean)]);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin(origin, callback) { if (!origin || allowedOrigins.has(origin)) return callback(null, true); return callback(new Error('This website origin is not allowed by CORS.')); }, credentials: true }));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: 'Too many sign-in attempts. Please wait and try again.' } });
app.get('/api/health', async (_req, res) => {
  let database = 'unavailable';
  try { await prisma.$queryRaw`SELECT 1`; database = 'connected'; } catch { /* keep health response safe */ }
  res.status(database === 'connected' ? 200 : 503).json({ ok: database === 'connected', service: 'himtrip-api', database, timestamp: new Date().toISOString() });
});
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/admin', adminRoutes);
app.use((req, res) => res.status(404).json({ error: 'API route not found.' }));
app.use((error, _req, res, _next) => {
  if (error instanceof z.ZodError) return res.status(400).json({ error: error.issues[0]?.message || 'Invalid request.' });
  if (error?.message?.includes('CORS')) return res.status(403).json({ error: 'This website origin is not allowed.' });
  if (error?.code === 'P2002') return res.status(409).json({ error: 'That record already exists.' });
  console.error('[Himtrip API]', error?.message || error);
  res.status(500).json({ error: 'Something went wrong on the server. Please try again later.' });
});
const port = Number(process.env.PORT || 8000);
const server = app.listen(port, () => console.log(`Himtrip API listening on http://localhost:${port}`));
async function shutdown() { server.close(); await prisma.$disconnect(); process.exit(0); }
process.on('SIGINT', shutdown); process.on('SIGTERM', shutdown);
