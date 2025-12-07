/**
 * Price Updater Service
 * Periodically updates stock prices and portfolio ROI
 * Only runs during market hours (9:15 AM - 3:30 PM IST)
 */

import { storage } from "./storage";
import { calculatePortfolioROI, updateContestPortfolios } from "./portfolio-calculator";
import { wsManager } from "./websocket";
import { isMarketOpen, getNextMarketOpen, getMsUntilNextMarketOpen } from "./market-hours";
import { checkAndDistributePrizes } from "./prize-distributor";
import { checkAndCreateTomorrowContests } from "./daily-contest-scheduler";

const UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes

let updateInterval: NodeJS.Timeout | null = null;
let marketCheckInterval: NodeJS.Timeout | null = null;

/**
 * Start the price updater service
 * Only runs during market hours (9:15 AM - 3:30 PM IST)
 */
export function startPriceUpdater() {
  if (updateInterval || marketCheckInterval) {
    console.log("Price updater already running");
    return;
  }

  console.log("Starting price updater service...");
  console.log("Market hours: 9:15 AM - 3:30 PM IST (Monday to Friday)");

  // Check market status immediately
  checkMarketAndScheduleUpdates();

  // Check market status every minute to start/stop updates
  marketCheckInterval = setInterval(() => {
    checkMarketAndScheduleUpdates();
  }, 60 * 1000); // Check every minute

  // Check for ended contests and distribute prizes every hour
  setInterval(() => {
    checkAndDistributePrizes().catch((error) => {
      console.error("Error in periodic prize distribution:", error);
    });
  }, 60 * 60 * 1000); // Every hour

  // Also check immediately on startup for any pending prizes
  checkAndDistributePrizes().catch((error) => {
    console.error("Error in initial prize distribution check:", error);
  });
}

/**
 * Check market status and schedule/stop updates accordingly
 */
function checkMarketAndScheduleUpdates() {
  const marketOpen = isMarketOpen();

  if (marketOpen && !updateInterval) {
    // Market just opened - start updating
    console.log("Market is OPEN - Starting price updates (every 5 minutes)");
    
    // Update immediately
    updateAllPortfolios().catch((error) => {
      console.error("Error in initial portfolio update:", error);
    });

    // Then update every 5 minutes
    updateInterval = setInterval(() => {
      if (isMarketOpen()) {
        updateAllPortfolios().catch((error) => {
          console.error("Error in scheduled portfolio update:", error);
        });
      } else {
        // Market closed - stop updating
        console.log("Market closed - Stopping price updates");
        if (updateInterval) {
          clearInterval(updateInterval);
          updateInterval = null;
        }
      }
    }, UPDATE_INTERVAL);

    console.log(`Price updater active (updates every ${UPDATE_INTERVAL / 1000 / 60} minutes)`);
  } else if (!marketOpen && updateInterval) {
    // Market just closed - stop updating
    console.log("Market is CLOSED - Stopping price updates");
    const nextOpen = getNextMarketOpen();
    console.log(`Next market open: ${nextOpen.toLocaleString()}`);
    
    if (updateInterval) {
      clearInterval(updateInterval);
      updateInterval = null;
    }
    
    // Check for ended contests and distribute prizes when market closes
    checkAndDistributePrizes().catch((error) => {
      console.error("Error distributing prizes:", error);
    });
    
    // Create tomorrow's contests when market closes
    checkAndCreateTomorrowContests().catch((error) => {
      console.error("Error creating tomorrow's contests:", error);
    });
  }
}

/**
 * Stop the price updater service
 */
export function stopPriceUpdater() {
  if (updateInterval) {
    clearInterval(updateInterval);
    updateInterval = null;
  }
  if (marketCheckInterval) {
    clearInterval(marketCheckInterval);
    marketCheckInterval = null;
  }
  console.log("Price updater stopped");
}

/**
 * Update all active portfolios
 */
async function updateAllPortfolios() {
  try {
    console.log("Updating portfolio prices and ROI...");

    // Get all contests
    const contests = await storage.getAllContests();
    const now = new Date();

    // Update portfolios for live contests (only during market hours)
    for (const contest of contests) {
      try {
        const startDate = new Date(contest.startDate);
        const endDate = new Date(contest.endDate);

        // Only update if contest is live AND market is open
        // Contest is live only during market hours (9:15 AM - 3:30 PM IST)
        const isWithinContestDate = now >= startDate && now <= endDate;
        if (isWithinContestDate && isMarketOpen()) {
          await updateContestPortfolios(contest.id);
          
          // Broadcast contest update
          try {
            const leaderboard = await storage.getContestLeaderboard(contest.id);
            wsManager.broadcastContestUpdate(contest.id, {
              leaderboard: leaderboard.slice(0, 10), // Top 10
            });
          } catch (leaderboardError) {
            console.error(`Error broadcasting contest ${contest.id} update:`, leaderboardError);
          }
        }
      } catch (contestError) {
        console.error(`Error updating contest ${contest.id}:`, contestError);
        // Continue with next contest
      }
    }

    // Also update portfolios not in contests (general portfolios)
    // This is a simplified approach - in production, you'd want to batch this
    console.log("Portfolio prices updated");
  } catch (error) {
    console.error("Error updating portfolio prices:", error);
    // Don't throw - we want the service to keep running
  }
}

/**
 * Update a specific portfolio
 */
export async function updatePortfolio(portfolioId: string) {
  try {
    await calculatePortfolioROI(portfolioId);
  } catch (error) {
    console.error(`Error updating portfolio ${portfolioId}:`, error);
  }
}

