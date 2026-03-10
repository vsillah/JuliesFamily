import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const isServerless = !!process.env.VERCEL;
const isLocalhost = (process.env.DATABASE_URL || "").includes("localhost");

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: isServerless ? 1 : 10,
  idleTimeoutMillis: isServerless ? 10000 : 30000,
  connectionTimeoutMillis: 10000,
  ssl: isLocalhost ? false : { rejectUnauthorized: false },
  ...(isServerless ? { allowExitOnIdle: true } : {}),
});
export const db = drizzle(pool, { schema });
