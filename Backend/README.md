# Himtrip API — Node.js + Express + Prisma + PostgreSQL

This API powers customer registration/login, customer inquiry history, inquiry submissions, and a protected admin inquiry workspace. An inquiry is **not** a confirmed booking. Only an authenticated admin can change an inquiry status to Confirmed.

## Requirements
- Node.js 20 LTS or newer
- PostgreSQL 14+ (local or hosted)

## Local setup
1. Create a PostgreSQL database named `himtrip` (or choose another name).
2. Copy `.env.example` to `.env` and set `DATABASE_URL`, a random `JWT_SECRET` (32+ characters), and a unique `ADMIN_INITIAL_PASSWORD` (12+ characters).
3. Install and initialize:
   ```bash
   npm install
   npm run prisma:generate
   npm run db:migrate:deploy
   npm run db:seed
   npm run dev
   ```
   For a **brand-new empty database**, `db:migrate:deploy` applies the initial schema and quote-workflow migration. For your **existing Neon database that already has the original `users` and `inquiries` tables created with `db:push`**, first back it up, then run `npm run db:baseline:existing` exactly once to record the original schema as already present, followed by `npm run db:migrate:deploy`. Do not run the initial migration SQL directly against existing tables and do not run a destructive reset.
4. API health: `http://localhost:8000/api/health`.
5. Frontend `.env` should contain `VITE_API_URL=http://localhost:8000/api`.

The seed command creates/updates the admin specified by `ADMIN_EMAIL` (default `mkankit2613@gmail.com`). It does not use or need the user's email-provider password. Never commit `.env` or put secrets in frontend environment variables.

## API routes
- `POST /api/auth/register` — customer account
- `POST /api/auth/login` — customer or admin sign-in
- `GET /api/auth/me` — current signed-in user
- `POST /api/auth/logout` — clear session cookie
- `POST /api/inquiries` — create a trip inquiry; works for guests and signed-in customers
- `GET /api/inquiries/mine` — signed-in customer's inquiry history
- `GET /api/admin/dashboard` — admin stats
- `GET /api/admin/inquiries?search=&status=` — admin inquiry list
- `PATCH /api/admin/inquiries/:id` — admin-only status and notes update
- `GET /api/admin/customers` — admin customer list

## Inquiry status workflow
`New → Contacted → In Discussion → Confirmed / Cancelled → Completed` (status transitions are managed by admin). Confirmation means the admin has reviewed details and availability; this API does not take payments or automatically confirm availability.

## Email notifications (optional)
Set `RESEND_API_KEY`, `EMAIL_FROM`, and `SUPPORT_EMAIL` after creating/configuring a Resend account and verifying the sender/domain. If not configured, inquiry data still saves and the API reports that email delivery is not configured. Do not claim email has been sent unless Resend reports success.

## Deployment notes
- Deploy this API to a Node-capable host (e.g. Render, Railway, or another Node service), not as a static Vercel frontend.
- Keep the existing Neon PostgreSQL database and set `DATABASE_URL` only in the Render environment. Run `npm run prisma:generate` and the migration step appropriate to the database state above. For the existing Neon database, baseline the already-present initial schema once, then use `npm run db:migrate:deploy` on later releases. Never run `prisma migrate reset` against production.
- Set `NODE_ENV=production`, a strong unique `JWT_SECRET`, `FRONTEND_URL` to the exact deployed frontend origin, and `ADDITIONAL_FRONTEND_URLS` if needed. Prefer a custom domain where frontend and API are on the same site (for example `www.example.com` and `api.example.com`); some browsers restrict cookies when the frontend and API are hosted on unrelated domains.
- Production cookie sessions require HTTPS because cookies use `Secure` and `SameSite=None` in production. Vercel and Render default domains are different sites, and some browsers block third-party cookies; for the most reliable login persistence, use a custom domain/proxy arrangement that keeps the frontend and API same-site, then test login, refresh, logout and quote actions in the target browsers.
- This starter has no online payment gateway, no customer password-reset flow, and no customer password-change endpoint yet. Add those before production use if required. Review privacy/retention policies and conduct security testing before public launch.

## Trip quote workflow (added)

- Customers can send an inquiry with destination, preferred date, traveller count, duration, itinerary, notes and an approximate budget.
- Administrators can send/update a proposed quote with `PATCH /api/admin/inquiries/:id/quote` (`quotedPrice`, `quoteMessage`).
- An authenticated customer can accept/reject a pending quote with `POST /api/inquiries/:id/quote-response` (`response: "ACCEPTED" | "REJECTED"`). The API verifies ownership.
- Quote acceptance does not confirm the trip. An administrator must explicitly set inquiry status to `CONFIRMED` after reviewing the accepted quote.
- For an existing database with the previous schema, back it up and use the baseline-and-deploy instructions above. The quote migration is PostgreSQL SQL compatible with Neon; it adds fields and an enum without dropping existing customer or inquiry rows. Do not run a destructive reset.
