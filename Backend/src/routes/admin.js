import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth, requireAdmin);
const statusSchema = z.object({ status: z.enum(['NEW', 'CONTACTED', 'IN_DISCUSSION', 'CONFIRMED', 'CANCELLED', 'COMPLETED']), adminNotes: z.string().trim().max(3000).optional() });
const quoteSchema = z.object({ quotedPrice: z.coerce.number().int().min(1000).max(10000000), quoteMessage: z.string().trim().min(5).max(3000) });
const shape = (item) => ({ ...item, status: item.status.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, x => x.toUpperCase()), createdAt: item.createdAt.toISOString(), updatedAt: item.updatedAt.toISOString(), travelDate: item.travelDate?.toISOString() || null });
router.get('/dashboard', async (_req, res, next) => {
  try {
    const [total, fresh, confirmed, customers] = await Promise.all([
      prisma.inquiry.count(), prisma.inquiry.count({ where: { status: 'NEW' } }), prisma.inquiry.count({ where: { status: 'CONFIRMED' } }), prisma.user.count({ where: { role: 'CUSTOMER' } }),
    ]);
    res.json({ stats: { totalInquiries: total, newInquiries: fresh, confirmedTrips: confirmed, customers } });
  } catch (error) { next(error); }
});
router.get('/inquiries', async (req, res, next) => {
  try {
    const search = String(req.query.search || '').trim().slice(0, 100);
    const status = String(req.query.status || '').trim().toUpperCase().replaceAll(' ', '_');
    const where = {};
    if (search) where.OR = [ { name: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }, { reference: { contains: search, mode: 'insensitive' } }, { tripName: { contains: search, mode: 'insensitive' } } ];
    if (['NEW','CONTACTED','IN_DISCUSSION','CONFIRMED','CANCELLED','COMPLETED'].includes(status)) where.status = status;
    const inquiries = await prisma.inquiry.findMany({ where, orderBy: { createdAt: 'desc' }, take: 300 });
    res.json({ inquiries: inquiries.map(shape) });
  } catch (error) { next(error); }
});
router.patch('/inquiries/:id', async (req, res, next) => {
  try {
    const parsed = statusSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Choose a valid inquiry status.' });
    const existing = await prisma.inquiry.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Inquiry not found.' });
    if (parsed.data.status === 'CONFIRMED' && existing.quoteStatus !== 'ACCEPTED') return res.status(409).json({ error: 'The customer must accept the current quote before you confirm this trip.' });
    if (parsed.data.status === 'CONFIRMED' && ['CANCELLED', 'COMPLETED'].includes(existing.status)) return res.status(409).json({ error: 'A cancelled or completed inquiry cannot be confirmed again.' });
    const inquiry = await prisma.inquiry.update({ where: { id: req.params.id }, data: { status: parsed.data.status, ...(parsed.data.status === 'CONFIRMED' ? { bookingConfirmedAt: new Date() } : {}), ...(parsed.data.adminNotes !== undefined ? { adminNotes: parsed.data.adminNotes || null } : {}) } });
    res.json({ inquiry: shape(inquiry) });
  } catch (error) { next(error); }
});
router.patch('/inquiries/:id/quote', async (req, res, next) => {
  try {
    const parsed = quoteSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Enter a valid proposed price and message.' });
    const existing = await prisma.inquiry.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Inquiry not found.' });
    if (['CONFIRMED', 'CANCELLED', 'COMPLETED'].includes(existing.status)) return res.status(409).json({ error: 'A quote cannot be changed after this inquiry is closed or confirmed.' });
    const inquiry = await prisma.inquiry.update({ where: { id: existing.id }, data: {
      quotedPrice: parsed.data.quotedPrice,
      quoteMessage: parsed.data.quoteMessage,
      quoteStatus: 'SENT',
      quoteSentAt: new Date(),
      quoteRespondedAt: null,
      status: 'IN_DISCUSSION',
    } });
    res.json({ inquiry: shape(inquiry), message: 'Quote sent to the customer dashboard. The trip is not confirmed.' });
  } catch (error) { next(error); }
});

router.get('/customers', async (_req, res, next) => {
  try {
    const customers = await prisma.user.findMany({ where: { role: 'CUSTOMER' }, select: { id: true, name: true, email: true, phone: true, createdAt: true, _count: { select: { inquiries: true } } }, orderBy: { createdAt: 'desc' }, take: 500 });
    res.json({ customers: customers.map(c => ({ ...c, createdAt: c.createdAt.toISOString() })) });
  } catch (error) { next(error); }
});
export default router;
