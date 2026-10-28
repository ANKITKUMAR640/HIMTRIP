import jwt from 'jsonwebtoken';
import { prisma } from '../db.js';

export async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.himtrip_session || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null);
    if (!token) return res.status(401).json({ error: 'Please sign in to continue.' });
    const payload = jwt.verify(token, process.env.JWT_SECRET, { issuer: 'himtrip-api', audience: 'himtrip-web' });
    const user = await prisma.user.findUnique({ where: { id: payload.sub }, select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true } });
    if (!user) return res.status(401).json({ error: 'Your session is no longer valid. Please sign in again.' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Your session has expired. Please sign in again.' });
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'ADMIN') return res.status(403).json({ error: 'Administrator access is required.' });
  next();
}

export async function optionalAuth(req, _res, next) {
  try {
    const token = req.cookies?.himtrip_session || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null);
    if (token) {
      const payload = jwt.verify(token, process.env.JWT_SECRET, { issuer: 'himtrip-api', audience: 'himtrip-web' });
      const user = await prisma.user.findUnique({ where: { id: payload.sub }, select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true } });
      if (user) req.user = user;
    }
  } catch { /* guest inquiry is still allowed when no valid session exists */ }
  next();
}
