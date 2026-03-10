/**
 * One-time script: promote a user to super_admin by email.
 * Run after your first login so you can access the Admin Dashboard.
 *
 * Usage: npx tsx scripts/promote-admin.ts your@email.com
 */
import "dotenv/config";
import { config as dotenvConfig } from "dotenv";
dotenvConfig({ path: ".env.local", override: true });

import { db } from "../server/db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

const email = process.argv[2];
if (!email) {
  console.error("Usage: npx tsx scripts/promote-admin.ts <email>");
  console.error("Example: npx tsx scripts/promote-admin.ts you@example.com");
  process.exit(1);
}

async function main() {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  if (!user) {
    console.error(`No user found with email: ${email}`);
    console.error("Log in once at http://localhost:5000 so your account exists, then run this script.");
    process.exit(1);
  }
  if (user.role === "super_admin") {
    console.log(`User ${email} is already a super_admin.`);
    process.exit(0);
  }
  await db.update(users).set({ role: "super_admin", isAdmin: true }).where(eq(users.id, user.id));
  console.log(`Done. ${email} is now a super_admin. Log in again (or refresh) to see the Admin Dashboard link.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
