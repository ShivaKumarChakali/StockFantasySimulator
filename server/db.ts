import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as schema from "@shared/schema";

// Configure WebSocket for Neon
neonConfig.webSocketConstructor = ws;

let db: ReturnType<typeof drizzle> | null = null;

if (process.env.DATABASE_URL) {
  try {
    // Create a connection pool
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    // Create Drizzle instance
    db = drizzle(pool, { schema });
    console.log("✅ Database connection initialized");
  } catch (error) {
    console.error("❌ Failed to initialize database connection:", error);
    db = null;
  }
} else {
  console.log("⚠️  DATABASE_URL not set, using in-memory storage");
}

export { db };
export type Database = typeof db;

