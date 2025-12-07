import { db } from "./db";
import { colleges } from "@shared/schema";
import { seedContests } from "./seed-contests";

/**
 * Initialize database with default data (colleges, etc.)
 * Run this after migrations
 */
export async function initializeDatabase() {
  try {
    if (!db) {
      console.log("⚠️  Database not available, skipping initialization");
      return;
    }
    
    // Check if colleges already exist
    const existingColleges = await db.select().from(colleges).limit(1);
    
    if (existingColleges.length > 0) {
      console.log("✅ Database already initialized");
    } else {
      // Insert default colleges
      const defaultColleges = [
        { name: "CBIT Hyderabad", city: "Hyderabad" },
        { name: "VNR VJIET", city: "Hyderabad" },
        { name: "JNTU Hyderabad", city: "Hyderabad" },
        { name: "Vasavi College", city: "Hyderabad" },
      ];

      await db.insert(colleges).values(defaultColleges);
      console.log("✅ Initialized database with default colleges");
    }

    // Seed daily contests and dummy leaderboard data
    // Skip seeding in production to avoid errors - daily contest scheduler will handle it
    if (process.env.NODE_ENV !== "production") {
      try {
        await seedContests();
      } catch (error) {
        console.warn("⚠️  Could not seed contests (this is okay if they already exist):", error);
      }
    } else {
      console.log("ℹ️  Skipping contest seeding in production (daily scheduler will handle it)");
    }
  } catch (error) {
    console.error("❌ Failed to initialize database:", error);
    throw error;
  }
}

