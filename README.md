# CourtMatch

Find your next hitting partner. A platform for junior USTA tennis players to connect based on UTR ratings.

## Tech stack

- **Frontend:** React 18, Wouter, TanStack Query, Tailwind CSS, shadcn/ui
- **Backend:** Express.js, express-session
- **Database:** PostgreSQL via Drizzle ORM
- **Email:** Resend
- **Auth:** Email/password with bcrypt + session cookies

---

## Local development

### 1. Clone and install

```bash
git clone https://github.com/mirafitisova/CourtMatch.git
cd CourtMatch
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Fill in `.env`:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | Random string for signing sessions — run `openssl rand -base64 32` |
| `RESEND_API_KEY` | From [resend.com](https://resend.com) → API Keys |
| `APP_URL` | Base URL used in email links (e.g. `http://localhost:5000`) |
| `CRON_SECRET` | Optional — protects the parent reminder endpoint |

### 3. Set up the database

**Recommended: [Supabase](https://supabase.com) free tier**

1. Create a new Supabase project
2. Copy the connection string from **Settings → Database → Connection string → URI**
3. Paste it as `DATABASE_URL` in your `.env`
4. Push the schema:

```bash
npm run db:push
```

5. (Optional) Seed a test user:

```bash
npm run db:seed
# Sign in with: player@example.com / password123
```

### 4. Run

```bash
npm run dev
```

App runs at [http://localhost:5000](http://localhost:5000).

---

## Configuring Resend

1. Sign up at [resend.com](https://resend.com)
2. Go to **API Keys → Create API Key** (Sending access)
3. Add the key as `RESEND_API_KEY`
4. Go to **Domains → Add Domain** and verify your domain (e.g. `courtmatch.org`)
5. Update the `from` addresses in `server/email.ts` to use your verified domain

Until your domain is verified, emails only deliver to the address on your Resend account (useful for testing).

---

## Deployment

### Render (recommended)

This is an Express app — Render is the best fit.

1. Push to GitHub
2. Create a new **Web Service** on [render.com](https://render.com)
3. Set **Build Command:** `npm install && npm run build`
4. Set **Start Command:** `npm start`
5. Add environment variables:
   - `DATABASE_URL`
   - `SESSION_SECRET`
   - `RESEND_API_KEY`
   - `APP_URL` (your Render URL, e.g. `https://courtmatch.onrender.com`)
   - `CRON_SECRET`
   - `NODE_ENV=production`
6. Deploy

After first deploy, run the database migration in **Supabase SQL Editor:**

```sql
-- Run once after initial deploy
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_token varchar;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_expiry timestamp;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified boolean NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS parent_approval_token varchar;
ALTER TABLE users ADD COLUMN IF NOT EXISTS parent_approval_sent_at timestamp;
```

### 48-hour parent reminder cron job

Set up a Render Cron Job (or any HTTP scheduler):

- **Schedule:** `0 * * * *` (every hour)
- **URL:** `POST https://your-app.onrender.com/api/cron/parent-reminder`
- **Header:** `Authorization: Bearer <your CRON_SECRET>`

### Vercel (not recommended for this stack)

This app uses Express with server-side sessions, which doesn't map cleanly to Vercel's serverless model. Use Render instead. A `vercel.json` is included if you need it, but sessions and long-running connections may not work reliably.

---

## Available scripts

```bash
npm run dev        # Start dev server on port 5000
npm run build      # Build for production
npm start          # Run production build
npm run check      # TypeScript type check
npm run db:push    # Push schema changes to the database
npm run db:seed    # Seed a test user for development
```
