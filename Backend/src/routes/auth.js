import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const registerSchema = z.object({ name: z.string().trim().min(2).max(80), email: z.string().trim().email().max(254), password: z.string().min(8).max(128), phone: z.string().trim().max(30).optional().or(z.literal('')) });
const loginSchema = z.object({ email: z.string().trim().email().max(254), password: z.string().min(1).max(128) });
const cookieOptions = () => ({ httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', maxAge: 7 * 24 * 60 * 60 * 1000, path: '/' });
function issueSession(user, res) {
  const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: '7d', issuer: 'himtrip-api', audience: 'himtrip-web' });
  res.cookie('himtrip_session', token, cookieOptions());
}
const publicUser = (user) => ({ id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, createdAt: user.createdAt });

router.post('/register', async (req, res, next) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Please check your details.' });
    const { name, email, password, phone } = parsed.data;
    const normalizedEmail = email.toLowerCase();
    if (normalizedEmail === (process.env.ADMIN_EMAIL || 'mkankit2613@gmail.com').toLowerCase()) return res.status(400).json({ error: 'This email is reserved for the administrator. Please use the Admin sign-in option.' });
    const exists = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (exists) return res.status(409).json({ error: 'An account with this email already exists. Please sign in.' });
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({ data: { name, email: normalizedEmail, passwordHash, phone: phone || null, role: 'CUSTOMER' } });
    issueSession(user, res);
    res.status(201).json({ user: publicUser(user) });
  } catch (error) { next(error); }
});

router.post('/login', async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Enter a valid email address and password.' });
    const email = parsed.data.email.toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });
    const valid = user && await bcrypt.compare(parsed.data.password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Email or password is incorrect.' });
    if (email === (process.env.ADMIN_EMAIL || 'mkankit2613@gmail.com').toLowerCase() && user.role !== 'ADMIN') return res.status(403).json({ error: 'This email is configured for admin access. Run the backend seed and sign in using the admin credentials.' });
    issueSession(user, res);
    res.json({ user: publicUser(user) });
  } catch (error) { next(error); }
});

router.get('/me', requireAuth, (req, res) => res.json({ user: req.user }));
router.post('/logout', (_req, res) => {
  res.clearCookie('himtrip_session', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', path: '/' });
  res.json({ ok: true });
});
export default router;
