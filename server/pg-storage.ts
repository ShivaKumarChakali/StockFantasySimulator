import { 
  type User, 
  type InsertUser, 
  type College,
  type Contest,
  type Portfolio,
  type UserContest
} from "@shared/schema";
import { db } from "./db";
import { 
  users, 
  colleges, 
  contests, 
  portfolios, 
  holdings,
  userContests, 
  referrals 
} from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { IStorage } from "./storage";

export class PostgresStorage implements IStorage {
  private getDb() {
    if (!db) {
      throw new Error("Database connection not available. Set DATABASE_URL environment variable.");
    }
    return db;
  }
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const result = await this.getDb().select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.getDb().select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    const result = await this.getDb().select().from(users).where(eq(users.firebaseUid, firebaseUid)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser & { referralCode?: string; firebaseUid?: string }): Promise<User> {
    // Generate referral code if not provided
    let referralCode = insertUser.referralCode;
    if (!referralCode) {
      // Generate a random 8-character code
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      referralCode = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    }
    
    const [user] = await this.getDb().insert(users).values({
      firebaseUid: insertUser.firebaseUid || null,
      username: insertUser.username,
      email: insertUser.email || null,
      password: insertUser.password || null,
      collegeId: insertUser.collegeId || null,
      virtualBalance: 100, // 100 coins for new users
      referralCode: referralCode,
      referralCount: 0,
      festMode: false,
      isGuest: false,
    }).returning();

    return user;
  }

  async updateUserBalance(userId: string, amount: number): Promise<User | undefined> {
    const [user] = await this.getDb().select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) return undefined;

    const [updated] = await this.getDb()
      .update(users)
      .set({ virtualBalance: (user.virtualBalance || 0) + amount })
      .where(eq(users.id, userId))
      .returning();

    return updated;
  }

  async getUsersByCollege(collegeId: string): Promise<User[]> {
    return await this.getDb().select().from(users).where(eq(users.collegeId, collegeId));
  }

  // Colleges
  async getAllColleges(): Promise<College[]> {
    return await this.getDb().select().from(colleges);
  }

  async getOrCreateCollege(name: string, city?: string): Promise<College> {
    const existing = await this.getDb().select().from(colleges).where(eq(colleges.name, name)).limit(1);
    
    if (existing[0]) {
      return existing[0];
    }

    const [college] = await this.getDb().insert(colleges).values({
      name,
      city: city || null,
    }).returning();

    return college;
  }

  // Contests
  async getAllContests(): Promise<Contest[]> {
    return await this.getDb().select().from(contests).orderBy(desc(contests.createdAt));
  }

  async getContest(id: string): Promise<Contest | undefined> {
    const result = await this.getDb().select().from(contests).where(eq(contests.id, id)).limit(1);
    return result[0];
  }

  async createContest(contest: Omit<Contest, 'id' | 'createdAt' | 'entryFee'>): Promise<Contest> {
    const [newContest] = await this.getDb().insert(contests).values({
      name: contest.name,
      description: contest.description || null,
      // entryFee removed - educational platform, contests are free to join
      startingCapital: contest.startingCapital || 1000000,
      duration: contest.duration,
      startDate: contest.startDate,
      endDate: contest.endDate,
      festMode: contest.festMode || false,
      status: contest.status || 'upcoming',
    }).returning();

    return newContest;
  }

  async updateContestStatus(id: string, status: string): Promise<Contest | undefined> {
    const [updated] = await this.getDb()
      .update(contests)
      .set({ status })
      .where(eq(contests.id, id))
      .returning();

    return updated;
  }

  async getFestContests(): Promise<Contest[]> {
    return await this.getDb().select().from(contests).where(eq(contests.festMode, true));
  }

  // Portfolios
  async getPortfolio(id: string): Promise<Portfolio | undefined> {
    const result = await this.getDb().select().from(portfolios).where(eq(portfolios.id, id)).limit(1);
    return result[0];
  }

  async getUserPortfolios(userId: string): Promise<Portfolio[]> {
    return await this.getDb().select().from(portfolios).where(eq(portfolios.userId, userId));
  }

  async createPortfolio(portfolio: Omit<Portfolio, 'id' | 'createdAt'>): Promise<Portfolio> {
    const [newPortfolio] = await this.getDb().insert(portfolios).values({
      userId: portfolio.userId,
      contestId: portfolio.contestId || null,
      totalValue: portfolio.totalValue || 1000000,
      roi: portfolio.roi || 0,
      isLocked: portfolio.isLocked || false,
    }).returning();

    return newPortfolio;
  }

  async updatePortfolioROI(portfolioId: string, roi: number): Promise<Portfolio | undefined> {
    const [updated] = await this.getDb()
      .update(portfolios)
      .set({ roi })
      .where(eq(portfolios.id, portfolioId))
      .returning();

    return updated;
  }

  async updatePortfolioTotalValue(portfolioId: string, totalValue: number): Promise<Portfolio | undefined> {
    const [updated] = await this.getDb()
      .update(portfolios)
      .set({ totalValue })
      .where(eq(portfolios.id, portfolioId))
      .returning();

    return updated;
  }

  // Holdings
  async getHoldings(portfolioId: string): Promise<any[]> {
    return await this.getDb().select().from(holdings).where(eq(holdings.portfolioId, portfolioId));
  }

  async createHolding(holding: { portfolioId: string; stockSymbol: string; quantity: number; buyPrice: number; currentPrice: number }): Promise<any> {
    const [newHolding] = await this.getDb().insert(holdings).values({
      portfolioId: holding.portfolioId,
      stockSymbol: holding.stockSymbol,
      quantity: holding.quantity,
      buyPrice: holding.buyPrice,
      currentPrice: holding.currentPrice,
    }).returning();

    return newHolding;
  }

  async updateHoldingPrice(holdingId: string, currentPrice: number): Promise<any> {
    const [updated] = await this.getDb()
      .update(holdings)
      .set({ currentPrice })
      .where(eq(holdings.id, holdingId))
      .returning();

    return updated;
  }

  async deleteHolding(holdingId: string): Promise<void> {
    await this.getDb().delete(holdings).where(eq(holdings.id, holdingId));
  }

  // User Contests
  async joinContest(userId: string, contestId: string, portfolioId: string): Promise<UserContest> {
    const [userContest] = await this.getDb().insert(userContests).values({
      userId,
      contestId,
      portfolioId,
      joinedAt: new Date(),
      rank: null,
      finalRoi: null,
    }).returning();

    return userContest;
  }

  async getUserContests(userId: string): Promise<UserContest[]> {
    return await this.getDb().select().from(userContests).where(eq(userContests.userId, userId));
  }

  async getContestLeaderboard(contestId: string): Promise<UserContest[]> {
    // Get all user contests for this contest
    const userContestsList = await this.getDb()
      .select()
      .from(userContests)
      .where(eq(userContests.contestId, contestId));

    // Enrich with portfolio ROI for live contests
    const enriched = await Promise.all(
      userContestsList.map(async (uc) => {
        if (uc.portfolioId) {
          const portfolio = await this.getPortfolio(uc.portfolioId);
          // Use portfolio ROI if finalRoi is not set (live contest)
          const roi = uc.finalRoi !== null && uc.finalRoi !== undefined ? uc.finalRoi : (portfolio?.roi || 0);
          return { ...uc, roi } as UserContest & { roi: number };
        }
        return { ...uc, roi: uc.finalRoi || 0 } as UserContest & { roi: number };
      })
    );

    // Sort by ROI (finalRoi for ended contests, portfolio.roi for live)
    return enriched.sort((a, b) => (b.roi || 0) - (a.roi || 0));
  }

  async getCollegeLeaderboard(collegeId: string, contestId?: string): Promise<(UserContest & { user: User })[]> {
    const conditions = [eq(users.collegeId, collegeId)];
    
    if (contestId) {
      conditions.push(eq(userContests.contestId, contestId));
    }

    const results = await this.getDb()
      .select({
        userContest: userContests,
        user: users,
      })
      .from(userContests)
      .innerJoin(users, eq(userContests.userId, users.id))
      .where(and(...conditions));

    // Enrich with portfolio ROI for live contests (similar to getContestLeaderboard)
    const enriched = await Promise.all(
      results.map(async (r) => {
        const uc = r.userContest;
        if (uc.portfolioId) {
          const portfolio = await this.getPortfolio(uc.portfolioId);
          // Use portfolio ROI if finalRoi is not set (live contest)
          const roi = uc.finalRoi !== null && uc.finalRoi !== undefined ? uc.finalRoi : (portfolio?.roi || 0);
          return { ...uc, user: r.user, roi } as UserContest & { user: User; roi: number };
        }
        return { ...uc, user: r.user, roi: uc.finalRoi || 0 } as UserContest & { user: User; roi: number };
      })
    );

    // Sort by ROI (finalRoi for ended contests, portfolio.roi for live)
    return enriched.sort((a, b) => (b.roi || 0) - (a.roi || 0));
  }

  async updateUserContestFinalRoi(userContestId: string, finalRoi: number): Promise<void> {
    await this.getDb()
      .update(userContests)
      .set({ finalRoi })
      .where(eq(userContests.id, userContestId));
  }

  // Referrals
  async addReferral(referrerId: string, referredId: string): Promise<void> {
    await this.getDb().insert(referrals).values({
      referrerId,
      referredId,
      createdAt: new Date(),
    });

    // Update referral count
    await this.getDb()
      .update(users)
      .set({ referralCount: sql`${users.referralCount} + 1` })
      .where(eq(users.id, referrerId));
  }

  async getReferralCount(userId: string): Promise<number> {
    const [user] = await this.getDb().select().from(users).where(eq(users.id, userId)).limit(1);
    return user?.referralCount || 0;
  }

  async getTopReferrers(limit: number = 10): Promise<(User & { referralCount: number })[]> {
    const results = await this.getDb()
      .select()
      .from(users)
      .where(sql`${users.referralCount} > 0`)
      .orderBy(desc(users.referralCount))
      .limit(limit);
    
    // Filter out null referralCount and ensure type safety
    return results
      .filter((user): user is User & { referralCount: number } => 
        user.referralCount !== null && user.referralCount !== undefined
      )
      .map(user => ({ ...user, referralCount: user.referralCount! }));
  }
}

