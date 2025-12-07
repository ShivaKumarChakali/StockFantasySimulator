/**
 * Seed Daily Contests and Dummy Leaderboard Data
 * Creates 2 daily contests with dummy participants and portfolios
 */

import { storage } from "./storage";

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // UTC+5:30

/**
 * Get today's market open and close times in UTC
 */
function getTodayMarketTimes(): { startDate: Date; endDate: Date } {
  const now = new Date();
  const istTimestamp = now.getTime() + IST_OFFSET_MS;
  const istDate = new Date(istTimestamp);
  
  // Set to today at 9:15 AM IST
  istDate.setUTCHours(9, 15, 0, 0);
  const startDate = new Date(istDate.getTime() - IST_OFFSET_MS);
  
  // Set to today at 3:30 PM IST
  istDate.setUTCHours(15, 30, 0, 0);
  const endDate = new Date(istDate.getTime() - IST_OFFSET_MS);
  
  return { startDate, endDate };
}

/**
 * Seed contests and dummy data
 */
export async function seedContests() {
  try {
    console.log("🌱 Seeding daily contests and dummy leaderboard data...");

    // Get or create a college for dummy users
    const allColleges = await storage.getAllColleges();
    const defaultCollege = allColleges.length > 0 ? allColleges[0] : await storage.getOrCreateCollege("CBIT Hyderabad", "Hyderabad");

    // Check if contests already exist for today
    const { startDate, endDate } = getTodayMarketTimes();
    const allContests = await storage.getAllContests();
    const todayContests = allContests.filter(
      (c) => new Date(c.startDate).getTime() === startDate.getTime()
    );

    if (todayContests.length >= 2) {
      console.log("✅ Daily contests already exist");
      return;
    }

    // Create 2 daily contests
    const contest1 = await storage.createContest({
      name: "Daily Stock Challenge - Morning",
      description: "Join the morning trading session! Show your skills and compete for the top spot.",
      entryFee: 100,
      startingCapital: 1000000,
      duration: 1, // 1 day
      startDate,
      endDate,
      festMode: false,
      status: "live",
    });

    const contest2 = await storage.createContest({
      name: "Daily Stock Challenge - Afternoon",
      description: "Afternoon trading session. Make the best moves and climb the leaderboard!",
      entryFee: 50,
      startingCapital: 1000000,
      duration: 1,
      startDate,
      endDate,
      festMode: false,
      status: "live",
    });

    console.log(`✅ Created contests: ${contest1.name}, ${contest2.name}`);

    // Create dummy users if they don't exist
    const dummyUsers = [
      { username: "TraderPro", email: "traderpro@example.com" },
      { username: "StockMaster", email: "stockmaster@example.com" },
      { username: "InvestorKing", email: "investorking@example.com" },
      { username: "MarketGuru", email: "marketguru@example.com" },
      { username: "BullRunner", email: "bullrunner@example.com" },
      { username: "BearSlayer", email: "bearslayer@example.com" },
      { username: "PortfolioPro", email: "portfoliopro@example.com" },
      { username: "TradingElite", email: "tradingelite@example.com" },
    ];

    const createdUsers = [];
    for (const dummyUser of dummyUsers) {
      try {
        const existingUser = await storage.getUserByUsername(dummyUser.username);
        if (existingUser) {
          createdUsers.push(existingUser);
        } else {
          const newUser = await storage.createUser({
            ...dummyUser,
            password: "dummy123", // Dummy password
            collegeId: defaultCollege.id,
          });
          createdUsers.push(newUser);
        }
      } catch (error) {
        console.warn(`Could not create user ${dummyUser.username}:`, error);
      }
    }

    console.log(`✅ Created/found ${createdUsers.length} dummy users`);

    // Popular stocks for dummy portfolios
    const popularStocks = [
      { symbol: "RELIANCE", buyPrice: 1500, quantity: 100 },
      { symbol: "TCS", buyPrice: 3200, quantity: 50 },
      { symbol: "INFY", buyPrice: 1600, quantity: 80 },
      { symbol: "HDFCBANK", buyPrice: 1000, quantity: 120 },
      { symbol: "ICICIBANK", buyPrice: 1380, quantity: 100 },
      { symbol: "SBIN", buyPrice: 950, quantity: 150 },
      { symbol: "BHARTIARTL", buyPrice: 2100, quantity: 60 },
      { symbol: "ITC", buyPrice: 400, quantity: 200 },
      { symbol: "MARUTI", buyPrice: 16000, quantity: 10 },
      { symbol: "TITAN", buyPrice: 3800, quantity: 30 },
    ];

    // Create portfolios and join contests
    const contestsToSeed = [contest1, contest2];
    let portfolioCount = 0;

    for (const contest of contestsToSeed) {
      // Assign 4-5 users to each contest
      const usersForContest = createdUsers.slice(
        (contestsToSeed.indexOf(contest) * 4) % createdUsers.length,
        ((contestsToSeed.indexOf(contest) * 4) % createdUsers.length) + 4
      );

      for (const user of usersForContest) {
        try {
          // Create portfolio for this contest
          const portfolio = await storage.createPortfolio({
            userId: user.id,
            contestId: contest.id,
            totalValue: contest.startingCapital,
            roi: 0,
            isLocked: false,
          });

          // Add random holdings to portfolio
          const numHoldings = Math.floor(Math.random() * 4) + 2; // 2-5 holdings
          const selectedStocks = popularStocks
            .sort(() => Math.random() - 0.5)
            .slice(0, numHoldings);

          let totalInvested = 0;
          for (const stock of selectedStocks) {
            const investment = stock.buyPrice * stock.quantity;
            if (totalInvested + investment <= contest.startingCapital * 0.9) {
              // Add some randomness to buy prices (±5%)
              const priceVariation = stock.buyPrice * (0.95 + Math.random() * 0.1);
              
              await storage.createHolding({
                portfolioId: portfolio.id,
                stockSymbol: stock.symbol,
                quantity: stock.quantity,
                buyPrice: priceVariation,
                currentPrice: priceVariation, // Will be updated by price updater
              });
              totalInvested += investment;
            }
          }

          // Join contest
          await storage.joinContest(user.id, contest.id, portfolio.id);
          portfolioCount++;

          // Set random ROI between -5% and +15% for variety
          const roi = (Math.random() * 20 - 5); // -5 to +15
          const newTotalValue = contest.startingCapital * (1 + roi / 100);
          await storage.updatePortfolioROI(portfolio.id, roi);
          await storage.updatePortfolioTotalValue(portfolio.id, newTotalValue);
        } catch (error) {
          console.warn(`Error creating portfolio for ${user.username} in ${contest.name}:`, error);
        }
      }
    }

    console.log(`✅ Created ${portfolioCount} portfolios and joined users to contests`);
    console.log("✅ Seed complete! Contests are ready with dummy leaderboard data.");
  } catch (error) {
    console.error("❌ Error seeding contests:", error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedContests()
    .then(() => {
      console.log("Done!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Failed:", error);
      process.exit(1);
    });
}

