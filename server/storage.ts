import { 
  type User, 
  type InsertUser, 
  type College,
  type Contest,
  type Portfolio,
  type UserContest
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser & { referralCode?: string }): Promise<User>;
  updateUserBalance(userId: string, amount: number): Promise<User | undefined>;
  getUsersByCollege(collegeId: string): Promise<User[]>;
  
  // Colleges
  getAllColleges(): Promise<College[]>;
  getOrCreateCollege(name: string, city?: string): Promise<College>;
  
  // Contests
  getAllContests(): Promise<Contest[]>;
  getContest(id: string): Promise<Contest | undefined>;
  createContest(contest: Omit<Contest, 'id' | 'createdAt'>): Promise<Contest>;
  updateContestStatus(id: string, status: string): Promise<Contest | undefined>;
  getFestContests(): Promise<Contest[]>;
  
  // Portfolios
  getPortfolio(id: string): Promise<Portfolio | undefined>;
  getUserPortfolios(userId: string): Promise<Portfolio[]>;
  createPortfolio(portfolio: Omit<Portfolio, 'id' | 'createdAt'>): Promise<Portfolio>;
  updatePortfolioROI(portfolioId: string, roi: number): Promise<Portfolio | undefined>;
  
  // User Contests
  joinContest(userId: string, contestId: string, portfolioId: string): Promise<UserContest>;
  getUserContests(userId: string): Promise<UserContest[]>;
  getContestLeaderboard(contestId: string): Promise<UserContest[]>;
  getCollegeLeaderboard(collegeId: string, contestId?: string): Promise<(UserContest & { user: User })[]>;
  
  // Referrals
  addReferral(referrerId: string, referredId: string): Promise<void>;
  getReferralCount(userId: string): Promise<number>;
  getTopReferrers(limit?: number): Promise<(User & { referralCount: number })[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private colleges: Map<string, College> = new Map();
  private contests: Map<string, Contest> = new Map();
  private portfolios: Map<string, Portfolio> = new Map();
  private userContests: Map<string, UserContest> = new Map();
  private referrals: Map<string, { referrerId: string; referredId: string }> = new Map();

  constructor() {
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Add some default colleges
    const colleges: Record<string, College> = {
      cbit: { id: "cbit", name: "CBIT Hyderabad", city: "Hyderabad" as string | null },
      vnr: { id: "vnr", name: "VNR VJIET", city: "Hyderabad" as string | null },
      jntu: { id: "jntu", name: "JNTU Hyderabad", city: "Hyderabad" as string | null },
      vasavi: { id: "vasavi", name: "Vasavi College", city: "Hyderabad" as string | null },
    };
    Object.entries(colleges).forEach(([key, college]) => {
      this.colleges.set(key, college);
    });
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((user) => user.username === username);
  }

  async createUser(insertUser: InsertUser & { referralCode?: string }): Promise<User> {
    const id = randomUUID();
    const referralCode = insertUser.referralCode || id.slice(0, 8).toUpperCase();
    const user: User = {
      ...insertUser,
      id,
      referralCode,
      referralCount: 0,
      virtualBalance: 1000000,
      festMode: false,
      isGuest: false,
      createdAt: new Date(),
    } as User;
    this.users.set(id, user);
    return user;
  }

  async updateUserBalance(userId: string, amount: number): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    const updated = { ...user, virtualBalance: (user.virtualBalance || 0) + amount };
    this.users.set(userId, updated);
    return updated;
  }

  async getUsersByCollege(collegeId: string): Promise<User[]> {
    return Array.from(this.users.values()).filter((u) => u.collegeId === collegeId);
  }

  // Colleges
  async getAllColleges(): Promise<College[]> {
    return Array.from(this.colleges.values());
  }

  async getOrCreateCollege(name: string, city?: string): Promise<College> {
    let college = Array.from(this.colleges.values()).find((c) => c.name === name);
    if (!college) {
      const id = randomUUID();
      college = { id, name, city };
      this.colleges.set(id, college);
    }
    return college;
  }

  // Contests
  async getAllContests(): Promise<Contest[]> {
    return Array.from(this.contests.values());
  }

  async getContest(id: string): Promise<Contest | undefined> {
    return this.contests.get(id);
  }

  async createContest(contest: Omit<Contest, 'id' | 'createdAt'>): Promise<Contest> {
    const id = randomUUID();
    const newContest: Contest = { ...contest, id, createdAt: new Date() } as Contest;
    this.contests.set(id, newContest);
    return newContest;
  }

  async updateContestStatus(id: string, status: string): Promise<Contest | undefined> {
    const contest = this.contests.get(id);
    if (!contest) return undefined;
    const updated = { ...contest, status };
    this.contests.set(id, updated);
    return updated;
  }

  async getFestContests(): Promise<Contest[]> {
    return Array.from(this.contests.values()).filter((c) => c.festMode);
  }

  // Portfolios
  async getPortfolio(id: string): Promise<Portfolio | undefined> {
    return this.portfolios.get(id);
  }

  async getUserPortfolios(userId: string): Promise<Portfolio[]> {
    return Array.from(this.portfolios.values()).filter((p) => p.userId === userId);
  }

  async createPortfolio(portfolio: Omit<Portfolio, 'id' | 'createdAt'>): Promise<Portfolio> {
    const id = randomUUID();
    const newPortfolio: Portfolio = { ...portfolio, id, createdAt: new Date() } as Portfolio;
    this.portfolios.set(id, newPortfolio);
    return newPortfolio;
  }

  async updatePortfolioROI(portfolioId: string, roi: number): Promise<Portfolio | undefined> {
    const portfolio = this.portfolios.get(portfolioId);
    if (!portfolio) return undefined;
    const updated = { ...portfolio, roi };
    this.portfolios.set(portfolioId, updated);
    return updated;
  }

  // User Contests
  async joinContest(userId: string, contestId: string, portfolioId: string): Promise<UserContest> {
    const id = randomUUID();
    const userContest: UserContest = {
      id,
      userId,
      contestId,
      portfolioId,
      joinedAt: new Date(),
      rank: undefined,
      finalRoi: undefined,
    };
    this.userContests.set(id, userContest);
    return userContest;
  }

  async getUserContests(userId: string): Promise<UserContest[]> {
    return Array.from(this.userContests.values()).filter((uc) => uc.userId === userId);
  }

  async getContestLeaderboard(contestId: string): Promise<UserContest[]> {
    return Array.from(this.userContests.values())
      .filter((uc) => uc.contestId === contestId)
      .sort((a, b) => (b.finalRoi || 0) - (a.finalRoi || 0));
  }

  async getCollegeLeaderboard(collegeId: string, contestId?: string): Promise<(UserContest & { user: User })[]> {
    const collegeUsers = await this.getUsersByCollege(collegeId);
    const userIds = new Set(collegeUsers.map((u) => u.id));
    
    return Array.from(this.userContests.values())
      .filter((uc) => {
        const hasUser = userIds.has(uc.userId);
        const hasContest = !contestId || uc.contestId === contestId;
        return hasUser && hasContest;
      })
      .map((uc) => {
        const user = collegeUsers.find((u) => u.id === uc.userId);
        return {
          ...uc,
          user: user || { id: uc.userId, username: "Unknown", password: "" } as User,
        };
      })
      .sort((a, b) => (b.finalRoi ?? 0) - (a.finalRoi ?? 0));
  }

  // Referrals
  async addReferral(referrerId: string, referredId: string): Promise<void> {
    const id = randomUUID();
    this.referrals.set(id, { referrerId, referredId });
    const referrer = this.users.get(referrerId);
    if (referrer) {
      const updated = { ...referrer, referralCount: (referrer.referralCount || 0) + 1 };
      this.users.set(referrerId, updated);
    }
  }

  async getReferralCount(userId: string): Promise<number> {
    const user = this.users.get(userId);
    return user?.referralCount || 0;
  }

  async getTopReferrers(limit: number = 10): Promise<(User & { referralCount: number })[]> {
    return Array.from(this.users.values())
      .filter((u) => (u.referralCount ?? 0) > 0)
      .sort((a, b) => (b.referralCount ?? 0) - (a.referralCount ?? 0))
      .slice(0, limit)
      .map((u) => ({ ...u, referralCount: u.referralCount ?? 0 }));
  }
}

export const storage = new MemStorage();
