import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const colleges = pgTable("colleges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  city: text("city"),
});

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firebaseUid: varchar("firebase_uid").unique(),
  username: text("username").notNull().unique(),
  email: text("email"),
  password: text("password"), // Optional now (for Firebase users)
  collegeId: varchar("college_id").references(() => colleges.id),
  virtualBalance: real("virtual_balance").default(100), // 100 coins for new users
  referralCode: text("referral_code").unique(),
  referralCount: integer("referral_count").default(0),
  festMode: boolean("fest_mode").default(false),
  isGuest: boolean("is_guest").default(false),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const portfolios = pgTable("portfolios", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  contestId: varchar("contest_id"),
  totalValue: real("total_value").default(1000000),
  roi: real("roi").default(0),
  isLocked: boolean("is_locked").default(false),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const holdings = pgTable("holdings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  portfolioId: varchar("portfolio_id").notNull().references(() => portfolios.id),
  stockSymbol: text("stock_symbol").notNull(),
  quantity: integer("quantity").notNull(),
  buyPrice: real("buy_price").notNull(),
  currentPrice: real("current_price").notNull(),
});

export const contests = pgTable("contests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  entryFee: real("entry_fee").notNull(),
  startingCapital: real("starting_capital").default(1000000),
  duration: integer("duration").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  festMode: boolean("fest_mode").default(false),
  status: text("status").default("upcoming"),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const userContests = pgTable("user_contests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  contestId: varchar("contest_id").notNull().references(() => contests.id),
  portfolioId: varchar("portfolio_id").references(() => portfolios.id),
  joinedAt: timestamp("joined_at").default(sql`now()`),
  rank: integer("rank"),
  finalRoi: real("final_roi"),
});

export const referrals = pgTable("referrals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  referrerId: varchar("referrer_id").notNull().references(() => users.id),
  referredId: varchar("referred_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const insertUserSchema = createInsertSchema(users)
  .pick({
    username: true,
    email: true,
    password: true,
    collegeId: true,
  })
  .extend({
    username: z.string().min(3, "Username must be at least 3 characters"),
    email: z.string().email("Invalid email").optional(),
    password: z.string().min(6, "Password must be at least 6 characters"),
    collegeId: z.string().optional(),
  });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type College = typeof colleges.$inferSelect;
export type Contest = typeof contests.$inferSelect;
export type Portfolio = typeof portfolios.$inferSelect;
export type UserContest = typeof userContests.$inferSelect;
