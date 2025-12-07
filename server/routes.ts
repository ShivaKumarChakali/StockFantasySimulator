import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema } from "@shared/schema";
import { auth as firebaseAdminAuth } from "./firebase-admin";

// Middleware to verify Firebase token
async function verifyFirebaseToken(token: string): Promise<{ uid: string; email?: string; name?: string } | null> {
  try {
    if (!firebaseAdminAuth) {
      console.error("Firebase Admin Auth not initialized");
      return null;
    }
    
    const decodedToken = await firebaseAdminAuth.verifyIdToken(token);
    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name,
    };
  } catch (error: any) {
    console.error("Firebase token verification error:", error.message || error);
    // Log specific error types for debugging
    if (error.code === "auth/argument-error") {
      console.error("Invalid token format");
    } else if (error.code === "auth/id-token-expired") {
      console.error("Token expired");
    } else if (error.code === "auth/id-token-revoked") {
      console.error("Token revoked");
    }
    return null;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Firebase Auth sync endpoint
  app.post("/api/auth/firebase", async (req, res) => {
    try {
      const { firebaseUid, email, displayName, token } = req.body;
      
      // Verify token
      const decoded = await verifyFirebaseToken(token);
      if (!decoded || decoded.uid !== firebaseUid) {
        return res.status(401).json({ error: "Invalid token" });
      }

      // Check if user exists
      let user = await storage.getUserByFirebaseUid(firebaseUid);
      
      if (!user) {
        // Create new user with Firebase UID
        const username = displayName || email?.split("@")[0] || `user_${firebaseUid.slice(0, 8)}`;
        // Check if username exists, if so append number
        let finalUsername = username;
        let counter = 1;
        while (await storage.getUserByUsername(finalUsername)) {
          finalUsername = `${username}${counter}`;
          counter++;
        }

        user = await storage.createUser({
          firebaseUid,
          username: finalUsername,
          email: email,
          password: "", // Empty password for Firebase users (will be ignored)
          collegeId: undefined,
        });
      }

      // Set session
      (req.session as any).userId = user.id;
      (req.session as any).firebaseUid = firebaseUid;

      res.json(user);
    } catch (error) {
      console.error("Firebase auth error:", error);
      res.status(400).json({ error: "Authentication failed" });
    }
  });

  // Auth endpoints
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { firebaseUid, email, username, collegeId, token } = req.body;

      // If Firebase token provided, verify it
      if (token && firebaseUid) {
        const decoded = await verifyFirebaseToken(token);
        if (!decoded || decoded.uid !== firebaseUid) {
          return res.status(401).json({ error: "Invalid token" });
        }

        // Check if user already exists
        const existingUser = await storage.getUserByFirebaseUid(firebaseUid);
        if (existingUser) {
          (req.session as any).userId = existingUser.id;
          return res.json(existingUser);
        }

        // Check username uniqueness
        const usernameExists = await storage.getUserByUsername(username);
        if (usernameExists) {
          return res.status(400).json({ error: "Username already exists" });
        }

        const user = await storage.createUser({
          firebaseUid,
          username,
          email: email,
          password: "", // Empty password for Firebase users (will be ignored)
          collegeId: collegeId,
        });

        (req.session as any).userId = user.id;
        (req.session as any).firebaseUid = firebaseUid;

        return res.json(user);
      }

      // Legacy signup (without Firebase)
      const parsed = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(parsed.username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }
      const user = await storage.createUser(parsed);
      (req.session as any).userId = user.id;
      res.json(user);
    } catch (error) {
      console.error("Signup error:", error);
      res.status(400).json({ error: "Invalid request" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { token, username, password } = req.body;

      // Firebase token login
      if (token) {
        const decoded = await verifyFirebaseToken(token);
        if (!decoded) {
          return res.status(401).json({ error: "Invalid token" });
        }

        let user = await storage.getUserByFirebaseUid(decoded.uid);
        if (!user) {
          return res.status(404).json({ error: "User not found. Please sign up first." });
        }

        (req.session as any).userId = user.id;
        (req.session as any).firebaseUid = decoded.uid;
        return res.json(user);
      }

      // Legacy username/password login
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password required" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      (req.session as any).userId = user.id;
      res.json(user);
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ error: "Invalid request" });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    req.session?.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.json({ success: true });
    });
  });

  // College endpoints
  app.get("/api/colleges", async (req, res) => {
    const colleges = await storage.getAllColleges();
    res.json(colleges);
  });

  // Contest endpoints
  app.get("/api/contests", async (req, res) => {
    try {
      const festOnly = req.query.fest === "true";
      let contests = await storage.getAllContests();
      if (festOnly) {
        contests = await storage.getFestContests();
      }

      // Import market hours utility
      const { isMarketOpen } = await import("./market-hours");

      // Enrich contests with participant count and status
      const enriched = await Promise.all(
        contests.map(async (contest) => {
          const leaderboard = await storage.getContestLeaderboard(contest.id);
          const participantCount = leaderboard.length;

          // Calculate time remaining
          const now = new Date();
          const startDate = new Date(contest.startDate);
          const endDate = new Date(contest.endDate);
          
          let status = contest.status || "upcoming";
          let timeRemaining = "";

          // Contest is only LIVE during market hours (9:15 AM - 3:30 PM IST)
          const marketOpen = isMarketOpen();
          const isWithinContestDate = now >= startDate && now <= endDate;

          if (now < startDate) {
            // Before contest start date
            status = "upcoming";
            const diff = startDate.getTime() - now.getTime();
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            timeRemaining = `${days}d ${hours}h`;
          } else if (isWithinContestDate && marketOpen) {
            // Contest is live only during market hours
            status = "live";
            const diff = endDate.getTime() - now.getTime();
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            timeRemaining = `${days}d ${hours}h ${minutes}m`;
          } else if (isWithinContestDate && !marketOpen) {
            // Contest date range is valid but market is closed
            // Check if market will open today or if contest has ended
            if (now > endDate) {
              status = "ended";
              timeRemaining = "Ended";
            } else {
              // Market closed but contest hasn't ended - show as upcoming until market opens
              status = "upcoming";
              const { getNextMarketOpen } = await import("./market-hours");
              const nextOpen = getNextMarketOpen();
              const diff = nextOpen.getTime() - now.getTime();
              const hours = Math.floor(diff / (1000 * 60 * 60));
              const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
              timeRemaining = `Market opens in ${hours}h ${minutes}m`;
            }
          } else {
            // After contest end date
            status = "ended";
            timeRemaining = "Ended";
          }

          // Check if closing soon (less than 2 hours remaining AND market is open)
          const closingSoon = status === "live" && marketOpen && (endDate.getTime() - now.getTime()) < 2 * 60 * 60 * 1000;

          return {
            ...contest,
            participants: participantCount,
            status,
            timeRemaining,
            closingSoon,
            prizePool: contest.entryFee * participantCount, // Calculate prize pool
          };
        })
      );

      res.json(enriched);
    } catch (error) {
      console.error("Error fetching contests:", error);
      res.status(500).json({ error: "Failed to fetch contests" });
    }
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
    try {
      const leaderboard = await storage.getContestLeaderboard(req.params.contestId);
      
      // Enrich with user and portfolio data
      const enriched = await Promise.all(
        leaderboard.map(async (entry, index) => {
          const user = await storage.getUser(entry.userId);
          const portfolio = entry.portfolioId ? await storage.getPortfolio(entry.portfolioId) : null;
          
          return {
            ...entry,
            rank: index + 1,
            user,
            portfolio,
          };
        })
      );
      
      res.json(enriched);
    } catch (error) {
      console.error("Error fetching contest leaderboard:", error);
      res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
  });

  app.get("/api/leaderboard/college/:collegeId", async (req, res) => {
    try {
      const contestId = req.query.contestId as string | undefined;
      const leaderboard = await storage.getCollegeLeaderboard(req.params.collegeId, contestId);
      
      // Enrich with portfolio data (user already included in getCollegeLeaderboard)
      const enriched = await Promise.all(
        leaderboard.map(async (entry, index) => {
          const portfolio = entry.portfolioId ? await storage.getPortfolio(entry.portfolioId) : null;
          
          return {
            ...entry,
            rank: index + 1,
            portfolio,
          };
        })
      );
      
      res.json(enriched);
    } catch (error) {
      console.error("Error fetching college leaderboard:", error);
      res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
  });

  // User endpoints
  app.get("/api/users/:id", async (req, res) => {
    try {
      // Try to get by ID first
      let user = await storage.getUser(req.params.id);
      
      // If not found, try Firebase UID
      if (!user) {
        user = await storage.getUserByFirebaseUid(req.params.id);
      }
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // Get current user from session
  app.get("/api/users/me", async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching current user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
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
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { portfolioId } = req.body;
      if (!portfolioId) {
        return res.status(400).json({ error: "Portfolio ID required" });
      }

      // Get contest details
      const contest = await storage.getContest(req.params.contestId);
      if (!contest) {
        return res.status(404).json({ error: "Contest not found" });
      }

      // Check if contest has ended
      const now = new Date();
      const endDate = new Date(contest.endDate);
      if (now > endDate) {
        return res.status(400).json({ error: "Contest has ended. Cannot join ended contests." });
      }

      // Check if contest has started (optional - you might want to allow joining before start)
      // const startDate = new Date(contest.startDate);
      // if (now < startDate) {
      //   return res.status(400).json({ error: "Contest has not started yet" });
      // }

      // Check if user already joined
      const userContests = await storage.getUserContests(userId);
      if (userContests.some((uc) => uc.contestId === req.params.contestId)) {
        return res.status(400).json({ error: "Already joined this contest" });
      }

      // Check user balance
      const user = await storage.getUser(userId);
      if (!user || (user.virtualBalance || 0) < contest.entryFee) {
        return res.status(400).json({ error: "Insufficient balance" });
      }

      // Deduct entry fee
      await storage.updateUserBalance(userId, -contest.entryFee);

      // Join contest
      const userContest = await storage.joinContest(userId, req.params.contestId, portfolioId);
      
      // Calculate initial ROI so user appears in leaderboard immediately
      try {
        const { calculatePortfolioROI } = await import("./portfolio-calculator");
        await calculatePortfolioROI(portfolioId);
      } catch (error) {
        console.warn("Could not calculate initial ROI for portfolio:", error);
        // Continue anyway - ROI will be calculated by price updater
      }
      
      // Broadcast contest update via WebSocket
      try {
        const { wsManager } = await import("./websocket");
        const leaderboard = await storage.getContestLeaderboard(req.params.contestId);
        wsManager.broadcastContestUpdate(req.params.contestId, {
          leaderboard: leaderboard.slice(0, 10), // Top 10
        });
      } catch (error) {
        console.warn("Could not broadcast contest update:", error);
      }
      
      res.json(userContest);
    } catch (error) {
      console.error("Error joining contest:", error);
      res.status(400).json({ error: "Failed to join contest" });
    }
  });

  // Get current user's contests (using session) - MUST be before /api/users/:userId/contests
  app.get("/api/users/me/contests", async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const userContests = await storage.getUserContests(userId);
      
      // Enrich with contest details
      const enriched = await Promise.all(
        userContests.map(async (uc) => {
          const contest = await storage.getContest(uc.contestId);
          return {
            ...uc,
            contest,
          };
        })
      );

      res.json(enriched);
    } catch (error) {
      console.error("Error fetching user contests:", error);
      res.status(500).json({ error: "Failed to fetch contests" });
    }
  });

  // Get specific user's contests (must be after /api/users/me/contests)
  app.get("/api/users/:userId/contests", async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId || userId !== req.params.userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const userContests = await storage.getUserContests(userId);
      
      // Enrich with contest details
      const enriched = await Promise.all(
        userContests.map(async (uc) => {
          const contest = await storage.getContest(uc.contestId);
          return {
            ...uc,
            contest,
          };
        })
      );

      res.json(enriched);
    } catch (error) {
      console.error("Error fetching user contests:", error);
      res.status(500).json({ error: "Failed to fetch contests" });
    }
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

  // Stock data endpoints
  app.get("/api/stocks", async (req, res) => {
    try {
      const { symbols, exchange } = req.query;
      const { getMultipleStocksEOD, POPULAR_INDIAN_STOCKS, STOCK_NAMES } = await import("./stock-api");

      // If specific symbols provided, use them; otherwise use popular stocks
      // Yahoo Finance can fetch up to 25 stocks per request, so we can use more
      const stockSymbols = symbols
        ? (Array.isArray(symbols) ? symbols : [symbols]).slice(0, 25) as string[]
        : POPULAR_INDIAN_STOCKS.slice(0, 25);

      const exchangeCode = (exchange as string) || "NSE";
      
      console.log(`[API] Fetching stocks: ${stockSymbols.join(", ")}`);
      const fetchStartTime = Date.now();
      
      // Set a timeout to return results even if some stocks are still loading
      // Timeout is 20 seconds (longer than API's 15s timeout) to allow API calls to complete
      const timeoutPromise = new Promise<any[]>((resolve) => {
        setTimeout(() => {
          const elapsed = Date.now() - fetchStartTime;
          console.warn(`[API] Stock fetch timeout after ${elapsed}ms, returning empty array`);
          resolve([]);
        }, 20000); // 20 second timeout (longer than API's 15s)
      });
      
      // Wrap in try-catch to handle errors gracefully
      let stocks: any[] = [];
      try {
        const stocksPromise = getMultipleStocksEOD(stockSymbols, exchangeCode);
        stocks = await Promise.race([stocksPromise, timeoutPromise]);
        const elapsed = Date.now() - fetchStartTime;
        console.log(`[API] Stock fetch completed in ${elapsed}ms`);
      } catch (error) {
        const elapsed = Date.now() - fetchStartTime;
        console.error(`[API] Error in stock fetch after ${elapsed}ms:`, error);
        stocks = []; // Return empty array on error
      }

      console.log(`[API] Returning ${stocks.length} stocks`);
      
      // Log if we got fewer stocks than requested (for debugging)
      if (stocks.length < stockSymbols.length) {
        const receivedSymbols = stocks.map(s => s.symbol);
        const missingSymbols = stockSymbols.filter(s => !receivedSymbols.includes(s));
        if (missingSymbols.length > 0) {
          console.warn(`[API] Missing stocks: ${missingSymbols.join(", ")} (${stocks.length}/${stockSymbols.length} received)`);
        }
      }

      // Add company names and format for frontend
      const stocksWithNames = stocks.map((stock) => ({
        symbol: stock.symbol,
        companyName: STOCK_NAMES[stock.symbol] || stock.name || stock.symbol,
        currentPrice: stock.price,
        priceChange: stock.change,
        priceChangePercent: stock.changePercent,
        volume: stock.volume,
        high: stock.high,
        low: stock.low,
        open: stock.open,
        close: stock.close,
        date: stock.date,
      }));

      res.json(stocksWithNames);
    } catch (error) {
      console.error("[API] Error fetching stocks:", error);
      if (error instanceof Error) {
        console.error("[API] Error stack:", error.stack);
      }
      // Return empty array instead of error to prevent frontend crashes
      res.json([]);
    }
  });

  app.get("/api/stocks/:symbol", async (req, res) => {
    try {
      const { symbol } = req.params;
      const { exchange } = req.query;
      const { getStockEOD, STOCK_NAMES } = await import("./stock-api");

      const exchangeCode = (exchange as string) || "NSE";
      const stock = await getStockEOD(symbol, exchangeCode);

      if (!stock) {
        return res.status(404).json({ error: "Stock not found" });
      }

      res.json({
        ...stock,
        companyName: STOCK_NAMES[symbol] || stock.name,
      });
    } catch (error) {
      console.error("Error fetching stock:", error);
      res.status(500).json({ error: "Failed to fetch stock data" });
    }
  });

  app.get("/api/stocks/search/:query", async (req, res) => {
    try {
      const { query } = req.params;
      const { POPULAR_INDIAN_STOCKS, STOCK_NAMES, getMultipleStocksEOD } = await import("./stock-api");

      // Filter stocks by query
      const matchingSymbols = POPULAR_INDIAN_STOCKS.filter(
        (symbol) =>
          symbol.toLowerCase().includes(query.toLowerCase()) ||
          STOCK_NAMES[symbol]?.toLowerCase().includes(query.toLowerCase())
      );

      if (matchingSymbols.length === 0) {
        return res.json([]);
      }

      const exchangeCode = "NSE";
      const stocks = await getMultipleStocksEOD(matchingSymbols, exchangeCode);

      // Add company names and format for frontend
      const stocksWithNames = stocks.map((stock) => ({
        symbol: stock.symbol,
        companyName: STOCK_NAMES[stock.symbol] || stock.name || stock.symbol,
        currentPrice: stock.price,
        priceChange: stock.change,
        priceChangePercent: stock.changePercent,
        volume: stock.volume,
        high: stock.high,
        low: stock.low,
        open: stock.open,
        close: stock.close,
        date: stock.date,
      }));

      res.json(stocksWithNames);
    } catch (error) {
      console.error("Error searching stocks:", error);
      // Return empty array instead of error
      res.json([]);
    }
  });

  // Portfolio endpoints
  app.get("/api/portfolios", async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const portfolios = await storage.getUserPortfolios(userId);
      res.json(portfolios);
    } catch (error) {
      console.error("Error fetching portfolios:", error);
      res.status(500).json({ error: "Failed to fetch portfolios" });
    }
  });

  app.get("/api/portfolios/:id", async (req, res) => {
    try {
      const portfolio = await storage.getPortfolio(req.params.id);
      if (!portfolio) {
        return res.status(404).json({ error: "Portfolio not found" });
      }

      // Check ownership
      const userId = (req.session as any)?.userId;
      if (portfolio.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      res.json(portfolio);
    } catch (error) {
      console.error("Error fetching portfolio:", error);
      res.status(500).json({ error: "Failed to fetch portfolio" });
    }
  });

  app.post("/api/portfolios", async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized. Please sign in to create a portfolio." });
      }

      const { contestId, holdings, stockPrices } = req.body; // Accept stockPrices from frontend as fallback

      // Validate holdings
      if (!holdings || !Array.isArray(holdings) || holdings.length === 0) {
        return res.status(400).json({ error: "Please select at least one stock with quantity greater than 0" });
      }

      // Validate each holding
      for (const holding of holdings) {
        if (!holding.symbol || !holding.quantity || holding.quantity <= 0) {
          return res.status(400).json({ error: `Invalid holding: ${holding.symbol || 'unknown'} - quantity must be greater than 0` });
        }
      }

      // Create a map of frontend stock prices for fallback
      const frontendPriceMap = new Map<string, number>();
      if (stockPrices && typeof stockPrices === 'object') {
        Object.entries(stockPrices).forEach(([symbol, price]) => {
          if (typeof price === 'number' && price > 0) {
            frontendPriceMap.set(symbol, price);
          }
        });
      }

      // Create portfolio
      const portfolio = await storage.createPortfolio({
        userId,
        contestId: contestId || null,
        totalValue: 1000000, // Starting capital
        roi: 0,
        isLocked: false,
      });

      // Create holdings if provided
      if (holdings && Array.isArray(holdings)) {
        const { getStockEOD } = await import("./stock-api");
        const failedStocks: string[] = [];
        
        for (const holding of holdings) {
          const { symbol, quantity } = holding;
          
          try {
            // Try to get current stock price from API
            let stockPrice: number | null = null;
            const stockData = await getStockEOD(symbol, "NSE");
            
            if (stockData && stockData.price) {
              stockPrice = stockData.price;
            } else {
              // Fallback to frontend price if API fails
              stockPrice = frontendPriceMap.get(symbol) || null;
              
              if (!stockPrice) {
                console.warn(`Stock data not found for ${symbol} from API or frontend`);
                failedStocks.push(symbol);
                continue; // Skip if stock not found
              } else {
                console.log(`Using frontend price for ${symbol}: ${stockPrice}`);
              }
            }

            await storage.createHolding({
              portfolioId: portfolio.id,
              stockSymbol: symbol,
              quantity: quantity,
              buyPrice: stockPrice,
              currentPrice: stockPrice,
            });
          } catch (holdingError) {
            console.error(`Error creating holding for ${symbol}:`, holdingError);
            failedStocks.push(symbol);
          }
        }

        // If all stocks failed, return error
        if (failedStocks.length === holdings.length) {
          // Delete the portfolio if no holdings could be created
          try {
            // Note: We don't have a deletePortfolio method, but we can log this
            console.error(`Failed to create any holdings for portfolio ${portfolio.id}`);
          } catch (deleteError) {
            console.error("Error cleaning up portfolio:", deleteError);
          }
          return res.status(400).json({ 
            error: `Failed to fetch stock data for selected stocks: ${failedStocks.join(", ")}. Please try again.` 
          });
        }

        // Warn if some stocks failed
        if (failedStocks.length > 0) {
          console.warn(`Some stocks failed to load: ${failedStocks.join(", ")}`);
        }
      }

      res.json(portfolio);
    } catch (error) {
      console.error("Error creating portfolio:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to create portfolio";
      res.status(500).json({ error: errorMessage });
    }
  });

  // Holdings endpoints
  app.get("/api/portfolios/:portfolioId/holdings", async (req, res) => {
    try {
      const portfolio = await storage.getPortfolio(req.params.portfolioId);
      if (!portfolio) {
        return res.status(404).json({ error: "Portfolio not found" });
      }

      // Check ownership
      const userId = (req.session as any)?.userId;
      if (portfolio.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const holdings = await storage.getHoldings(req.params.portfolioId);
      
      // Get current prices for holdings
      const { getMultipleStocksEOD, STOCK_NAMES } = await import("./stock-api");
      const symbols = holdings.map((h) => h.stockSymbol);
      const stockPrices = await getMultipleStocksEOD(symbols, "NSE");
      const priceMap = new Map(stockPrices.map((s) => [s.symbol, s.price]));

      // Enrich holdings with current prices and calculate P/L
      const enrichedHoldings = holdings.map((holding) => {
        const currentPrice = priceMap.get(holding.stockSymbol) || holding.currentPrice;
        const currentValue = currentPrice * holding.quantity;
        const investedValue = holding.buyPrice * holding.quantity;
        const plAmount = currentValue - investedValue;
        const plPercent = investedValue !== 0 ? (plAmount / investedValue) * 100 : 0;

        return {
          ...holding,
          currentPrice,
          currentValue,
          plAmount,
          plPercent,
          companyName: STOCK_NAMES[holding.stockSymbol] || holding.stockSymbol,
        };
      });

      res.json(enrichedHoldings);
    } catch (error) {
      console.error("Error fetching holdings:", error);
      res.status(500).json({ error: "Failed to fetch holdings" });
    }
  });

  app.delete("/api/holdings/:id", async (req, res) => {
    try {
      await storage.deleteHolding(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting holding:", error);
      res.status(500).json({ error: "Failed to delete holding" });
    }
  });

  // Portfolio ROI calculation endpoints
  app.post("/api/portfolios/:portfolioId/calculate-roi", async (req, res) => {
    try {
      const portfolio = await storage.getPortfolio(req.params.portfolioId);
      if (!portfolio) {
        return res.status(404).json({ error: "Portfolio not found" });
      }

      // Check ownership
      const userId = (req.session as any)?.userId;
      if (portfolio.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const { calculatePortfolioROI } = await import("./portfolio-calculator");
      const metrics = await calculatePortfolioROI(req.params.portfolioId);

      if (!metrics) {
        return res.status(500).json({ error: "Failed to calculate ROI" });
      }

      res.json(metrics);
    } catch (error) {
      console.error("Error calculating ROI:", error);
      res.status(500).json({ error: "Failed to calculate ROI" });
    }
  });

  app.post("/api/contests/:contestId/update-roi", async (req, res) => {
    try {
      const { updateContestPortfolios } = await import("./portfolio-calculator");
      await updateContestPortfolios(req.params.contestId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating contest ROI:", error);
      res.status(500).json({ error: "Failed to update ROI" });
    }
  });

  // Prize distribution endpoint (admin/manual trigger)
  app.post("/api/contests/distribute-prizes", async (req, res) => {
    try {
      const { checkAndDistributePrizes } = await import("./prize-distributor");
      await checkAndDistributePrizes();
      res.json({ success: true, message: "Prize distribution completed" });
    } catch (error) {
      console.error("Error distributing prizes:", error);
      res.status(500).json({ error: "Failed to distribute prizes" });
    }
  });

  const httpServer = createServer(app);
  
  // Initialize WebSocket server
  const { wsManager } = await import("./websocket");
  wsManager.initialize(httpServer);
  
  return httpServer;
}
