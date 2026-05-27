# BrokerBook — Real Estate CRM for Mumbai Brokers

A full-stack CRM for independent real estate brokers in Mumbai. Built with Next.js 14 (App Router), Supabase (Auth + PostgreSQL + Storage), Prisma ORM, Twilio WhatsApp, and deployed on Vercel.

---

## Features

- **Buyer management** — track budget, BHK, localities, purpose, follow-up history
- **Property listings** — manage inventory with photos, amenities, owner details
- **Deal pipeline** — Kanban board with 6 stages and document checklist per deal
- **Site visit scheduler** — log visits, capture buyer feedback
- **Smart matching** — algorithm scores buyer-property compatibility (0–100)
- **WhatsApp messaging** — send follow-ups and owner reports via Twilio
- **Automated cron jobs** — daily follow-up reminders, stale deal alerts, weekly owner reports
- **Responsive UI** — sidebar on desktop, bottom nav on mobile; saffron-orange brand colours

---

## Local Setup

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/brokerbook.git
cd brokerbook
npm install
```

### 2. Set up environment variables

```bash
cp .env.local.example .env.local
# Fill in all values — see the Supabase Setup and Twilio sections below
```

### 3. Set up Supabase (see Supabase Setup section below)

### 4. Run Prisma migrations

```bash
npm run db:migrate
# Or for first-time push without migration history:
npm run db:push
```

### 5. Generate Prisma client

```bash
npm run db:generate
```

### 6. Seed demo data

```bash
# First, create demo@brokerbook.in in Supabase Auth (see seed file instructions)
npm run db:seed
```

### 7. Start development server

```bash
npm run dev
# Open http://localhost:3000
```

---

## Supabase Setup

### 1. Create a project
Go to [supabase.com](https://supabase.com) → New Project → choose a region close to India (Singapore).

### 2. Get your credentials
| Variable | Where to find |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Settings → API → Project API Keys → `anon public` |
| `SUPABASE_SERVICE_ROLE_KEY` | Settings → API → Project API Keys → `service_role` ⚠️ keep secret |
| `DATABASE_URL` | Settings → Database → Connection String → URI → **Session mode** (port 5432 via pooler) — append `?pgbouncer=true&connection_limit=1` |
| `DIRECT_URL` | Settings → Database → Connection String → URI → **Direct connection** (port 5432, host `db.xxx.supabase.co`) |

### 3. Create Storage buckets
In Supabase Dashboard → Storage → New bucket:
- **`property-photos`** — Public access: ON
- **`profile-photos`** — Public access: ON

### 4. Enable Email auth
Authentication → Providers → Email → Enable

### 5. Create demo user (for seeding)
Authentication → Users → Add User → Email: `demo@brokerbook.in` → copy the UUID → paste into `prisma/seed.ts` at the `DEMO_SUPABASE_UID` constant.

---

## Vercel Deployment

### Step-by-step

1. **Push to GitHub** (see GitHub Setup below)
2. Go to [vercel.com](https://vercel.com) → Add New Project → Import your GitHub repo
3. Set **Framework Preset** to `Next.js` (auto-detected)
4. Add all environment variables from `.env.local` in the Vercel dashboard under **Settings → Environment Variables**
5. Click **Deploy**

### Required environment variables in Vercel
All variables from `.env.local.example` must be added:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`
- `DIRECT_URL`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_WHATSAPP_FROM`
- `CRON_SECRET` (generate with `openssl rand -hex 32`)

### Cron Jobs
Vercel reads `vercel.json` automatically and schedules the three cron jobs. They call your API routes with the `Authorization: Bearer <CRON_SECRET>` header. No extra setup needed.

---

## GitHub + Vercel Auto-Deploy

1. Create a new GitHub repo (e.g., `brokerbook`)
2. Push your code:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/brokerbook.git
   git push -u origin main
   ```
3. In Vercel → Project → Settings → Git → Connect to your GitHub repo
4. Every push to `main` triggers a production deploy automatically
5. Every PR creates a preview deployment

---

## Twilio WhatsApp Setup

1. Sign up at [twilio.com](https://twilio.com)
2. Go to **Messaging → Try it out → Send a WhatsApp message**
3. Follow the sandbox setup (scan QR with your phone WhatsApp)
4. Your sandbox number (e.g., `+14155238886`) → set as `TWILIO_WHATSAPP_FROM=whatsapp:+14155238886`
5. For production: apply for a WhatsApp Business Account via Twilio

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 App Router, React 18, Tailwind CSS |
| Backend | Next.js API Routes (serverless) |
| Database | Supabase PostgreSQL via Prisma ORM |
| Auth | Supabase Auth (cookie-based sessions) |
| Storage | Supabase Storage (property & profile photos) |
| WhatsApp | Twilio Messaging API |
| Cron | Vercel Cron Jobs |
| Deployment | Vercel (frontend + API) |
| Version Control | GitHub |
