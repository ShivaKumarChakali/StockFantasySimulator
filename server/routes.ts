import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth endpoints
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const parsed = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(parsed.username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }
      const user = await storage.createUser(parsed);
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: "Invalid request" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: "Invalid request" });
    }
  });

  // College endpoints
  app.get("/api/colleges", async (req, res) => {
    const colleges = await storage.getAllColleges();
    res.json(colleges);
  });

  // Contest endpoints
  app.get("/api/contests", async (req, res) => {
    const festOnly = req.query.fest === "true";
    let contests = await storage.getAllContests();
    if (festOnly) {
      contests = await storage.getFestContests();
    }
    res.json(contests);
  });

  app.post("/api/contests", async (req, res) => {
    try {
      const contest = await storage.createContest(req.body);
      res.json(contest);
    } catch (error) {
      res.status(400).json({ error: "Invalid contest data" });
    }
  });

  app.get("/api/contests/:id", async (req, res) => {
    const contest = await storage.getContest(req.params.id);
    if (!contest) {
      return res.status(404).json({ error: "Contest not found" });
    }
    res.json(contest);
  });

  // Leaderboard endpoints
  app.get("/api/leaderboard/contest/:contestId", async (req, res) => {
    const leaderboard = await storage.getContestLeaderboard(req.params.contestId);
    res.json(leaderboard);
  });

  app.get("/api/leaderboard/college/:collegeId", async (req, res) => {
    const contestId = req.query.contestId as string | undefined;
    const leaderboard = await storage.getCollegeLeaderboard(req.params.collegeId, contestId);
    res.json(leaderboard);
  });

  // User endpoints
  app.get("/api/users/:id", async (req, res) => {
    const user = await storage.getUser(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  });

  app.get("/api/users/college/:collegeId", async (req, res) => {
    const users = await storage.getUsersByCollege(req.params.collegeId);
    res.json(users);
  });

  app.patch("/api/users/:id/balance", async (req, res) => {
    try {
      const { amount } = req.body;
      const user = await storage.updateUserBalance(req.params.id, amount);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: "Invalid request" });
    }
  });

  // Contest participation
  app.post("/api/contests/:contestId/join", async (req, res) => {
    try {
      const { userId, portfolioId } = req.body;
      const userContest = await storage.joinContest(userId, req.params.contestId, portfolioId);
      res.json(userContest);
    } catch (error) {
      res.status(400).json({ error: "Failed to join contest" });
    }
  });

  app.get("/api/users/:userId/contests", async (req, res) => {
    const contests = await storage.getUserContests(req.params.userId);
    res.json(contests);
  });

  // Referral endpoints
  app.post("/api/referrals", async (req, res) => {
    try {
      const { referrerId, referredId } = req.body;
      await storage.addReferral(referrerId, referredId);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: "Failed to add referral" });
    }
  });

  app.get("/api/referrals/top", async (req, res) => {
    const limit = parseInt(req.query.limit as string) || 10;
    const topReferrers = await storage.getTopReferrers(limit);
    res.json(topReferrers);
  });

  app.get("/api/referrals/count/:userId", async (req, res) => {
    const count = await storage.getReferralCount(req.params.userId);
    res.json({ count });
  });

  const httpServer = createServer(app);
  return httpServer;
}
