# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev          # Start dev server (Express + Vite HMR) on port 5000

# Build & Production
npm run build        # Build frontend (Vite → dist/public/) and server (esbuild → dist/index.cjs)
npm start            # Run production build

# Type checking
npm run check        # TypeScript type check (tsc)

# Database
npm run db:push      # Push Drizzle schema changes to PostgreSQL
```

No test runner is configured.

## Architecture

**CourtMatch** is a platform for junior USTA tennis players to find hitting partners based on UTR ratings. Tagline: "Find your next hitting partner." It's a full-stack TypeScript monorepo with a web app, a nascent React Native/Expo mobile app, and a shared contract layer.

### Stack

- **Frontend:** React 18, Wouter (routing), TanStack Query (server state), Tailwind CSS, shadcn/ui (Radix), Framer Motion
- **Backend:** Express.js, express-session with PostgreSQL store
- **Database:** PostgreSQL via Neon serverless (`@neondatabase/serverless`), Drizzle ORM
- **Email:** Resend API for hit request notifications
- **Auth:** Email/password with bcrypt, session cookies
- **Build:** Vite (client), esbuild (server)

### Project Layout

```
client/src/        # React web app
  App.tsx          # Router and route definitions
  pages/           # Page components (dashboard, auth, players, requests, profile)
  components/      # Shared UI components
  hooks/           # Custom hooks (useAuth, usePlayers, useHitRequests, etc.)
  lib/             # API client utilities

server/
  index.ts         # Express entry point, middleware setup
  routes.ts        # All API route handlers
  storage.ts       # Database access layer (IStorage interface + DatabaseStorage impl)
  auth.ts          # bcrypt password helpers
  email.ts         # Resend email notifications

shared/
  schema.ts        # Drizzle table definitions + Zod validation schemas (single source of truth)

migrations/        # Drizzle-generated SQL migrations
```

### Data Model

Four tables: `users` (auth, UUID PK), `profiles` (UTR rating, bio, location, availability — one per user), `hitRequests` (requester/receiver, status: pending/accepted/rejected/completed, scheduledTime, location, message), `sessions` (express-session store).

### API Shape

All routes are under `/api/`. The shared `schema.ts` exports Zod schemas used for both DB typing and request validation. Route contracts flow: `client/src/lib/queryClient.ts` → `server/routes.ts` → `server/storage.ts`.

Key endpoints:
- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- `GET /api/profiles`, `GET /api/profiles/:userId`, `PUT /api/profiles`
- `GET /api/hit-requests`, `POST /api/hit-requests`, `PATCH /api/hit-requests/:id/status`

### Auth Flow

Session-based: user logs in → `userId` stored in session → `isAuthenticated` middleware reads `req.session.userId` on protected routes → session persisted in PostgreSQL `sessions` table.

### Environment Variables

- `DATABASE_URL` — Neon PostgreSQL connection string
- `SESSION_SECRET` — Session signing secret
- `RESEND_API_KEY` — Email notifications (optional)
- `PORT` — Defaults to 5000
