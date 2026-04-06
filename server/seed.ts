/**
 * Seed script — creates a test user and profile for local development.
 * Run with: npm run db:seed
 */
import { db } from "./db";
import { users } from "@shared/models/auth";
import { profiles } from "@shared/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

const TEST_EMAIL = "player@example.com";

async function seed() {
  console.log("[seed] Starting...");

  // Check if test user already exists
  const [existing] = await db.select().from(users).where(eq(users.email, TEST_EMAIL));
  if (existing) {
    console.log(`[seed] Test user already exists (${TEST_EMAIL}) — skipping.`);
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash("password123", 10);

  const [user] = await db
    .insert(users)
    .values({
      email: TEST_EMAIL,
      passwordHash,
      firstName: "Alex",
      lastName: "Tennis",
      dateOfBirth: "2005-06-15",
      zipCode: "90210",
      accountStatus: "ACTIVE",
      emailVerified: true,
      guidelinesAcceptedAt: new Date(),
    })
    .returning();

  console.log(`[seed] Created user: ${user.email} (id: ${user.id})`);

  await db.insert(profiles).values({
    userId: user.id,
    utrRating: 8.5,
    bio: "Junior USTA player looking for hitting partners. Love playing baseline rallies.",
    location: "Los Angeles, CA",
    availability: "Weekends and weekday evenings",
  });

  console.log("[seed] Created profile.");
  console.log("[seed] Done.");
  console.log("");
  console.log("  Sign in with:");
  console.log(`  Email:    ${TEST_EMAIL}`);
  console.log("  Password: password123");
  console.log("");
  process.exit(0);
}

seed().catch((err) => {
  console.error("[seed] Failed:", err);
  process.exit(1);
});
