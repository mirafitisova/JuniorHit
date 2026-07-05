import type { Express, RequestHandler } from "express";
import { z } from "zod";
import { db } from "./db";
import { courts } from "@shared/models/tennis";
import { users } from "@shared/models/auth";
import { hitRequests } from "@shared/schema";
import { authStorage } from "./replit_integrations/auth/storage";
import { eq, sql, and, gte, count } from "drizzle-orm";

// ── Admin middleware ───────────────────────────────────────────────────────────

export const requireAdmin: RequestHandler = async (req, res, next) => {
  const userId = (req.session as any).userId;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const user = await authStorage.getUser(userId);
  if (!user?.isAdmin) return res.status(403).json({ message: "Forbidden" });

  next();
};

// ── Validation ────────────────────────────────────────────────────────────────

const courtSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().min(1, "Address is required"),
  latitude: z.number(),
  longitude: z.number(),
  courtType: z.enum(["PUBLIC_FREE", "PUBLIC_PAY", "PRIVATE", "SCHOOL"]),
  cost: z.string().nullable().optional(),
  bookingMethod: z.string().min(1, "Booking method is required"),
  numberOfCourts: z.number().int().min(1),
  surface: z.string().min(1, "Surface is required"),
  hasLights: z.boolean(),
  hours: z.string().nullable().optional(),
  netCondition: z.enum(["GOOD", "FAIR", "POOR"]).nullable().optional(),
  hasRestrooms: z.boolean(),
  parkingInfo: z.string().nullable().optional(),
  bestTimes: z.string().nullable().optional(),
  juniorNotes: z.string().nullable().optional(),
  bookingUrl: z.string().url("Must be a valid URL").nullable().optional().or(z.literal("")),
});

// ── Routes ────────────────────────────────────────────────────────────────────

export function registerAdminRoutes(app: Express): void {
  app.get("/api/admin/courts", requireAdmin, async (_req, res) => {
    try {
      const all = await db.select().from(courts).orderBy(courts.name);
      return res.json(all);
    } catch (err) {
      console.error("[admin] List courts error:", err);
      return res.status(500).json({ message: "Failed to load courts" });
    }
  });

  // Create court
  app.post("/api/admin/courts", requireAdmin, async (req, res) => {
    try {
      const input = courtSchema.parse(req.body);
      const [court] = await db
        .insert(courts)
        .values({
          ...input,
          cost: input.cost ?? null,
          hours: input.hours ?? null,
          netCondition: input.netCondition ?? null,
          parkingInfo: input.parkingInfo ?? null,
          bestTimes: input.bestTimes ?? null,
          juniorNotes: input.juniorNotes ?? null,
          bookingUrl: input.bookingUrl || null,
        })
        .returning();
      return res.status(201).json(court);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error("[admin] Create court error:", err);
      return res.status(500).json({ message: "Failed to create court" });
    }
  });

  // Update court
  app.put("/api/admin/courts/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const input = courtSchema.parse(req.body);
      const [updated] = await db
        .update(courts)
        .set({
          ...input,
          cost: input.cost ?? null,
          hours: input.hours ?? null,
          netCondition: input.netCondition ?? null,
          parkingInfo: input.parkingInfo ?? null,
          bestTimes: input.bestTimes ?? null,
          juniorNotes: input.juniorNotes ?? null,
          bookingUrl: input.bookingUrl || null,
          updatedAt: new Date(),
        })
        .where(eq(courts.id, id))
        .returning();
      if (!updated) return res.status(404).json({ message: "Court not found" });
      return res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error("[admin] Update court error:", err);
      return res.status(500).json({ message: "Failed to update court" });
    }
  });

  app.delete("/api/admin/courts/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid court ID" });
      await db.delete(courts).where(eq(courts.id, id));
      return res.status(204).send();
    } catch (err) {
      console.error("[admin] Delete court error:", err);
      return res.status(500).json({ message: "Failed to delete court" });
    }
  });

  // Geocode address → lat/lng via Nominatim (OpenStreetMap, free, no key needed)
  app.get("/api/admin/geocode", requireAdmin, async (req, res) => {
    const { address } = req.query;
    if (!address || typeof address !== "string") {
      return res.status(400).json({ message: "address query param is required" });
    }

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&countrycodes=us`;
      const response = await fetch(url, {
        headers: {
          "User-Agent": "CourtMatch/1.0 (courtmatch.org)",
          "Accept-Language": "en",
        },
      });
      const data = await response.json() as any[];
      if (!data.length) return res.json(null);
      return res.json({
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        displayName: data[0].display_name,
      });
    } catch (err) {
      console.error("[admin] Geocode error:", err);
      return res.status(500).json({ message: "Geocoding failed" });
    }
  });

  // ── Analytics ─────────────────────────────────────────────────────────────────

  app.get("/api/admin/analytics", requireAdmin, async (_req, res) => {
    try {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

      const [usersRows, activeRows, sessRows, sessWeekRows, topCourts, topPlayers, funnelRows, avgTimeRows] =
        await Promise.all([
          db.select({
            total: count(),
            thisWeek: sql<number>`COUNT(*) FILTER (WHERE created_at >= ${weekAgo})::int`,
            lastWeek: sql<number>`COUNT(*) FILTER (WHERE created_at >= ${twoWeeksAgo} AND created_at < ${weekAgo})::int`,
          }).from(users),

          db.execute(
            sql`SELECT COUNT(DISTINCT sess->>'userId') AS cnt FROM sessions WHERE expire > NOW()`
          ),

          db.select({
            total: count(),
            thisWeek: sql<number>`COUNT(*) FILTER (WHERE created_at >= ${weekAgo})::int`,
            lastWeek: sql<number>`COUNT(*) FILTER (WHERE created_at >= ${twoWeeksAgo} AND created_at < ${weekAgo})::int`,
          }).from(hitRequests).where(eq(hitRequests.status, "completed")),

          db.select({ cnt: count() }).from(hitRequests)
            .where(and(gte(hitRequests.scheduledTime, weekAgo), sql`status IN ('accepted','completed')`)),

          db.execute(sql`
            SELECT c.id, c.name, COUNT(hr.id)::int AS session_count
            FROM courts c
            LEFT JOIN hit_requests hr ON hr.court_id = c.id AND hr.status = 'completed'
            GROUP BY c.id, c.name
            ORDER BY session_count DESC
            LIMIT 5
          `),

          db.execute(sql`
            SELECT u.id, u.first_name, u.last_name,
                   COUNT(DISTINCT hr.id)::int AS session_count
            FROM users u
            LEFT JOIN hit_requests hr
              ON (hr.requester_id = u.id OR hr.receiver_id = u.id)
              AND hr.status = 'completed'
            GROUP BY u.id, u.first_name, u.last_name
            ORDER BY session_count DESC
            LIMIT 10
          `),

          db.execute(sql`
            SELECT
              COUNT(*)::int                                                        AS signed_up,
              COUNT(*) FILTER (WHERE email_verified = true)::int                  AS email_verified,
              COUNT(*) FILTER (WHERE account_status = 'ACTIVE')::int              AS active,
              (SELECT COUNT(DISTINCT pp.user_id)::int FROM player_profiles pp)    AS profile_completed,
              (
                SELECT COUNT(DISTINCT sub.uid)::int
                FROM (
                  SELECT requester_id AS uid FROM hit_requests WHERE status='completed'
                  UNION ALL
                  SELECT receiver_id  AS uid FROM hit_requests WHERE status='completed'
                ) sub
              )                                                                    AS had_first_session
            FROM users
          `),

          db.execute(sql`
            SELECT ROUND(
              AVG(EXTRACT(EPOCH FROM (fs.first_session_at - u.created_at)) / 86400.0)::numeric, 1
            ) AS avg_days
            FROM users u
            INNER JOIN (
              SELECT uid, MIN(scheduled_time) AS first_session_at
              FROM (
                SELECT requester_id AS uid, scheduled_time FROM hit_requests WHERE status='completed' AND scheduled_time IS NOT NULL
                UNION ALL
                SELECT receiver_id  AS uid, scheduled_time FROM hit_requests WHERE status='completed' AND scheduled_time IS NOT NULL
              ) t
              GROUP BY uid
            ) fs ON fs.uid = u.id
          `),
        ]);

      const usersStats = usersRows[0];
      const activeUsers = Number((activeRows.rows[0] as any)?.cnt ?? 0);
      const sessStats = sessRows[0];
      const sessionsThisWeek = sessWeekRows[0]?.cnt ?? 0;
      const avgSessions = activeUsers > 0
        ? Math.round((Number(sessStats.thisWeek) / activeUsers) * 100) / 100
        : 0;
      const funnel = funnelRows.rows[0] as Record<string, number>;
      const rawAvgDays = (avgTimeRows.rows[0] as any)?.avg_days;
      const avgDaysToFirstSession = rawAvgDays != null ? Number(rawAvgDays) : null;

      return res.json({
        users: {
          total: Number(usersStats.total),
          thisWeek: Number(usersStats.thisWeek),
          lastWeek: Number(usersStats.lastWeek),
        },
        activeUsers,
        sessions: {
          total: Number(sessStats.total),
          thisWeek: Number(sessStats.thisWeek),
          lastWeek: Number(sessStats.lastWeek),
        },
        sessionsThisWeek: Number(sessionsThisWeek),
        avgSessionsPerUser: avgSessions,
        topCourts: (topCourts.rows as any[]).map(r => ({
          id: r.id,
          name: r.name ?? `Court #${r.id}`,
          sessionCount: r.session_count,
        })),
        topPlayers: (topPlayers.rows as any[]).map(r => ({
          id: r.id,
          name: [r.first_name, r.last_name].filter(Boolean).join(" ") || r.id,
          sessionCount: r.session_count,
        })),
        funnel: {
          signedUp: funnel.signed_up,
          emailVerified: funnel.email_verified,
          active: funnel.active,
          profileCompleted: funnel.profile_completed,
          hadFirstSession: funnel.had_first_session,
        },
        avgDaysToFirstSession,
      });
    } catch (err) {
      console.error("[admin] Analytics error:", err);
      return res.status(500).json({ message: "Failed to load analytics" });
    }
  });

  // ── User management ───────────────────────────────────────────────────────────

  app.get("/api/admin/users", requireAdmin, async (_req, res) => {
    try {
      const rows = await db.execute(sql`
        SELECT
          u.id,
          u.email,
          u.first_name,
          u.last_name,
          u.account_status,
          u.is_admin,
          u.email_verified,
          u.created_at,
          u.zip_code,
          COUNT(DISTINCT hr.id)::int AS session_count,
          (
            SELECT (MAX(s.expire) - INTERVAL '7 days')
            FROM sessions s
            WHERE s.sess->>'userId' = u.id
          ) AS last_active
        FROM users u
        LEFT JOIN hit_requests hr
          ON (hr.requester_id = u.id OR hr.receiver_id = u.id)
          AND hr.status = 'completed'
        GROUP BY u.id
        ORDER BY u.created_at DESC
      `);

      return res.json(rows.rows);
    } catch (err) {
      console.error("[admin] Users list error:", err);
      return res.status(500).json({ message: "Failed to load users" });
    }
  });

  app.patch("/api/admin/users/:id", requireAdmin, async (req, res) => {
    const { id } = req.params;
    const schema = z.object({
      accountStatus: z.enum(["ACTIVE", "SUSPENDED", "FLAGGED"]),
    });
    try {
      const { accountStatus } = schema.parse(req.body);
      const target = await authStorage.getUser(id);
      if (!target) return res.status(404).json({ message: "User not found" });
      if (target.isAdmin) return res.status(403).json({ message: "Cannot change status of an admin account" });
      await db.update(users).set({ accountStatus }).where(eq(users.id, id));
      return res.json({ ok: true });
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      console.error("[admin] Update user error:", err);
      return res.status(500).json({ message: "Failed to update user" });
    }
  });
}
