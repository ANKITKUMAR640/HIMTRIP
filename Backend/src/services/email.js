import { Resend } from 'resend';

export async function sendInquiryNotification(inquiry) {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) return { sent: false, reason: 'Email provider is not configured.' };
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: [process.env.SUPPORT_EMAIL || process.env.ADMIN_EMAIL || 'mkankit2613@gmail.com'],
      subject: `New Himtrip inquiry ${inquiry.reference}`,
      text: `A new trip inquiry has been received.\n\nReference: ${inquiry.reference}\nName: ${inquiry.name}\nEmail: ${inquiry.email}\nPhone: ${inquiry.phone || 'Not provided'}\nTrip: ${inquiry.tripName || 'Not specified'}\n\nMessage:\n${inquiry.message}\n\nThis is an inquiry, not a confirmed booking.`,
    });
    if (result.error) throw new Error(result.error.message || 'Email provider returned an error.');
    return { sent: true };
  } catch (error) {
    console.error('Resend notification failed:', error?.message || error);
    return { sent: false, reason: 'Email delivery failed; inquiry was still saved.' };
  }
}
