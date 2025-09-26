import 'dotenv/config';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set in .env file");
}

// Create a connection pool for Postgres
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,                 // optional: max connections in pool
  idleTimeoutMillis: 30000, // optional: idle timeout
  connectionTimeoutMillis: 10000 // optional: connection timeout
});

// Pass pool to drizzle with schema
export const db = drizzle(pool, { schema });
