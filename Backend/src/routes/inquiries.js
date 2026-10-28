import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { sendInquiryNotification } from '../services/email.js';

const router = Router();
const inquirySchema = z.object({ name: z.string().trim().min(2).max(80), email: z.string().trim().email().max(254), phone: z.string().trim().max(30).optional().or(z.literal('')), message: z.string().trim().min(10).max(4000), tripName: z.string().trim().max(160).optional().or(z.literal('')), travelDate: z.string().optional().or(z.literal('')), travelers: z.coerce.number().int().min(1).max(30).optional(), budget: z.string().trim().max(80).optional().or(z.literal('')), duration: z.string().trim().max(60).optional().or(z.literal('')), itinerary: z.string().trim().max(2000).optional().or(z.literal('')), notes: z.string().trim().max(2000).optional().or(z.literal('')), destinationState: z.string().trim().max(100).optional().or(z.literal('')) });
const shape = (item) => ({ ...item, status: item.status.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, x => x.toUpperCase()), createdAt: item.createdAt.toISOString(), updatedAt: item.updatedAt.toISOString() });
function makeReference() { return `HIM-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`; }

router.post('/', optionalAuth, async (req, res, next) => {
  try {
    const parsed = inquirySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Please check your inquiry details.' });
    const data = parsed.data;
    const user = req.user;
    let travelDate = null;
    if (data.travelDate) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(data.travelDate)) return res.status(400).json({ error: 'Please enter a valid travel date.' });
      travelDate = new Date(`${data.travelDate}T00:00:00.000Z`);
      if (Number.isNaN(travelDate.getTime()) || travelDate.toISOString().slice(0, 10) !== data.travelDate) return res.status(400).json({ error: 'Please enter a valid travel date.' });
    }
    const inquiry = await prisma.inquiry.create({ data: {
      reference: makeReference(), name: data.name, email: data.email.toLowerCase(), phone: data.phone || null,
      message: data.message, tripName: data.tripName || null, travelDate, travelers: data.travelers || null,
      budget: data.budget || null, duration: data.duration || null, itinerary: data.itinerary || null, notes: data.notes || null, destinationState: data.destinationState || null, userId: user?.role === 'CUSTOMER' ? user.id : null,
    } });
    const email = await sendInquiryNotification(inquiry);
    res.status(201).json({ inquiry: shape(inquiry), emailNotification: email, message: 'Your inquiry has been received. It is not a confirmed booking; the Himtrip team must check details and availability.' });
  } catch (error) { next(error); }
});

const quoteResponseSchema = z.object({ response: z.enum(['ACCEPTED', 'REJECTED']) });
router.post('/:id/quote-response', requireAuth, async (req, res, next) => {
  try {
    if (req.user.role !== 'CUSTOMER') return res.status(403).json({ error: 'Only customers can respond to a trip quote.' });
    const parsed = quoteResponseSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Choose accept or reject for this quote.' });
    const existing = await prisma.inquiry.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Trip inquiry not found.' });
    const ownsInquiry = existing.userId === req.user.id || (!existing.userId && existing.email.toLowerCase() === req.user.email.toLowerCase());
    if (!ownsInquiry) return res.status(403).json({ error: 'You can only respond to quotes for your own inquiries.' });
    if (existing.quoteStatus !== 'SENT' || !existing.quotedPrice) return res.status(409).json({ error: 'There is no pending quote to respond to.' });
    if (['CONFIRMED', 'CANCELLED', 'COMPLETED'].includes(existing.status)) return res.status(409).json({ error: 'This inquiry is closed and can no longer accept a quote response.' });
    // Atomic condition prevents two near-simultaneous accept/reject requests from overwriting each other.
    const changed = await prisma.inquiry.updateMany({
      where: { id: existing.id, quoteStatus: 'SENT', status: { notIn: ['CONFIRMED', 'CANCELLED', 'COMPLETED'] } },
      data: {
        quoteStatus: parsed.data.response,
        quoteRespondedAt: new Date(),
        ...(existing.userId ? {} : { userId: req.user.id }),
      },
    });
    if (changed.count !== 1) return res.status(409).json({ error: 'This quote has already been answered or the inquiry was closed. Refresh your dashboard.' });
    const inquiry = await prisma.inquiry.findUnique({ where: { id: existing.id } });
    res.json({ inquiry: shape(inquiry), message: parsed.data.response === 'ACCEPTED' ? 'Quote accepted. The trip is still pending administrator confirmation.' : 'Quote rejected. You can contact Himtrip if you would like to discuss another option.' });
  } catch (error) { next(error); }
});

router.get('/mine', requireAuth, async (req, res, next) => {
  try {
    if (req.user.role === 'ADMIN') return res.status(403).json({ error: 'Use the admin workspace to view all inquiries.' });
    const inquiries = await prisma.inquiry.findMany({ where: { OR: [{ userId: req.user.id }, { userId: null, email: req.user.email }] }, orderBy: { createdAt: 'desc' } });
    res.json({ inquiries: inquiries.map(shape) });
  } catch (error) { next(error); }
});
export default router;
