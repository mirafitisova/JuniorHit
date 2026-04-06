-- Migration 001: Extended tennis schema
-- Run this in the Supabase SQL Editor.
-- Safe to run multiple times — all statements use IF NOT EXISTS / DO $$ guards.

-- ── Enums ─────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE "team_level" AS ENUM ('VARSITY', 'JV', 'NONE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "handedness" AS ENUM ('RIGHT', 'LEFT', 'AMBIDEXTROUS');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "court_type" AS ENUM ('PUBLIC_FREE', 'PUBLIC_PAY', 'PRIVATE', 'SCHOOL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "net_condition" AS ENUM ('GOOD', 'FAIR', 'POOR');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "match_request_status" AS ENUM (
    'PENDING', 'ACCEPTED', 'DECLINED', 'COUNTER', 'EXPIRED', 'CANCELLED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "cost_split" AS ENUM (
    'I_COVER', 'SPLIT_50_50', 'YOU_COVER', 'FREE_COURT'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "match_session_status" AS ENUM (
    'CONFIRMED',
    'PLAYER1_CHECKED_IN',
    'PLAYER2_CHECKED_IN',
    'BOTH_CHECKED_IN',
    'COMPLETED',
    'NO_SHOW',
    'CANCELLED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── player_profiles ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "player_profiles" (
  "id"                   serial PRIMARY KEY,
  "user_id"              varchar NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
  "utr_rating"           real,
  "utr_profile_url"      varchar,
  "utr_verified"         boolean NOT NULL DEFAULT false,
  "school"               varchar,
  "grade"                integer,        -- 9 | 10 | 11 | 12
  "team_level"           "team_level",
  "handedness"           "handedness" NOT NULL DEFAULT 'RIGHT',
  "play_styles"          text[] NOT NULL DEFAULT '{}',
  "bio"                  varchar(280),
  "profile_completeness" integer NOT NULL DEFAULT 0,
  "created_at"           timestamp DEFAULT now(),
  "updated_at"           timestamp DEFAULT now()
);

-- ── weekly_availability ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "weekly_availability" (
  "id"           serial PRIMARY KEY,
  "user_id"      varchar NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "day_of_week"  integer NOT NULL,         -- 0 (Sun) – 6 (Sat)
  "start_time"   varchar(5) NOT NULL,      -- "HH:MM"
  "end_time"     varchar(5) NOT NULL       -- "HH:MM"
);

-- ── courts ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "courts" (
  "id"               serial PRIMARY KEY,
  "name"             varchar NOT NULL,
  "address"          text NOT NULL,
  "latitude"         double precision NOT NULL,
  "longitude"        double precision NOT NULL,
  "court_type"       "court_type" NOT NULL,
  "cost"             varchar,
  "booking_method"   varchar NOT NULL,
  "number_of_courts" integer NOT NULL,
  "surface"          varchar NOT NULL,
  "has_lights"       boolean NOT NULL DEFAULT false,
  "hours"            varchar,
  "net_condition"    "net_condition",
  "has_restrooms"    boolean NOT NULL DEFAULT false,
  "parking_info"     text,
  "best_times"       text,
  "junior_notes"     text,
  "booking_url"      varchar,
  "created_at"       timestamp DEFAULT now(),
  "updated_at"       timestamp DEFAULT now()
);

-- ── match_requests ────────────────────────────────────────────────────────────
-- Supersedes the simple "hit_requests" table. Both coexist until the new UI
-- is shipped and the old table is retired.

CREATE TABLE IF NOT EXISTS "match_requests" (
  "id"                  serial PRIMARY KEY,
  "sender_id"           varchar NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "receiver_id"         varchar NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "status"              "match_request_status" NOT NULL DEFAULT 'PENDING',
  "proposed_date"       timestamp NOT NULL,
  "proposed_start_time" varchar(5) NOT NULL,   -- "HH:MM"
  "proposed_end_time"   varchar(5) NOT NULL,   -- "HH:MM"
  "court_id"            integer REFERENCES "courts"("id") ON DELETE SET NULL,
  "practice_type"       varchar NOT NULL,
  "cost_split"          "cost_split" NOT NULL,
  "note"                text,
  "expires_at"          timestamp NOT NULL,    -- createdAt + 48h
  "created_at"          timestamp DEFAULT now(),
  "updated_at"          timestamp DEFAULT now()
);

-- ── match_sessions ────────────────────────────────────────────────────────────
-- Created when a match_request is accepted.
-- Named "match_sessions" to avoid conflict with the express-session "sessions" table.

CREATE TABLE IF NOT EXISTS "match_sessions" (
  "id"                    serial PRIMARY KEY,
  "request_id"            integer NOT NULL REFERENCES "match_requests"("id") ON DELETE CASCADE,
  "player1_id"            varchar NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "player2_id"            varchar NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "court_id"              integer REFERENCES "courts"("id") ON DELETE SET NULL,
  "scheduled_at"          timestamp NOT NULL,
  "practice_type"         varchar NOT NULL,
  "status"                "match_session_status" NOT NULL DEFAULT 'CONFIRMED',
  "player1_checked_in_at" timestamp,
  "player2_checked_in_at" timestamp,
  "completed_at"          timestamp,
  "created_at"            timestamp DEFAULT now(),
  "updated_at"            timestamp DEFAULT now()
);

-- ── session_ratings ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "session_ratings" (
  "id"             serial PRIMARY KEY,
  "session_id"     integer NOT NULL REFERENCES "match_sessions"("id") ON DELETE CASCADE,
  "rater_id"       varchar NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "rated_user_id"  varchar NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "reliability"    integer NOT NULL CHECK ("reliability" BETWEEN 1 AND 5),
  "skill_accuracy" integer NOT NULL CHECK ("skill_accuracy" BETWEEN 1 AND 5),
  "partner_quality" integer NOT NULL CHECK ("partner_quality" BETWEEN 1 AND 5),
  "note"           text,
  "created_at"     timestamp DEFAULT now(),
  -- Each player can only rate the other once per session
  UNIQUE ("session_id", "rater_id", "rated_user_id")
);

-- ── favorites ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "favorites" (
  "id"               serial PRIMARY KEY,
  "user_id"          varchar NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "favorite_user_id" varchar NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "created_at"       timestamp DEFAULT now(),
  -- Prevent duplicate favorites
  UNIQUE ("user_id", "favorite_user_id")
);

-- ── Indexes ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS "idx_player_profiles_user_id"       ON "player_profiles"("user_id");
CREATE INDEX IF NOT EXISTS "idx_weekly_availability_user_id"   ON "weekly_availability"("user_id");
CREATE INDEX IF NOT EXISTS "idx_courts_location"               ON "courts"("latitude", "longitude");
CREATE INDEX IF NOT EXISTS "idx_match_requests_sender"         ON "match_requests"("sender_id");
CREATE INDEX IF NOT EXISTS "idx_match_requests_receiver"       ON "match_requests"("receiver_id");
CREATE INDEX IF NOT EXISTS "idx_match_requests_status"         ON "match_requests"("status");
CREATE INDEX IF NOT EXISTS "idx_match_requests_expires_at"     ON "match_requests"("expires_at");
CREATE INDEX IF NOT EXISTS "idx_match_sessions_player1"        ON "match_sessions"("player1_id");
CREATE INDEX IF NOT EXISTS "idx_match_sessions_player2"        ON "match_sessions"("player2_id");
CREATE INDEX IF NOT EXISTS "idx_match_sessions_scheduled_at"   ON "match_sessions"("scheduled_at");
CREATE INDEX IF NOT EXISTS "idx_session_ratings_session"       ON "session_ratings"("session_id");
CREATE INDEX IF NOT EXISTS "idx_session_ratings_rated_user"    ON "session_ratings"("rated_user_id");
CREATE INDEX IF NOT EXISTS "idx_favorites_user_id"             ON "favorites"("user_id");
