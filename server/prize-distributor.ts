/**
 * Prize Distribution Service
 * Distributes coins to contest winners when contests end
 */

import { storage } from "./storage";

/**
 * Prize distribution structure:
 * - 1st place: 50% of prize pool
 * - 2nd place: 30% of prize pool
 * - 3rd place: 20% of prize pool
 * If fewer than 3 participants, adjust accordingly
 */
const PRIZE_DISTRIBUTION = [
  { rank: 1, percentage: 0.5 }, // 50%
  { rank: 2, percentage: 0.3 }, // 30%
  { rank: 3, percentage: 0.2 }, // 20%
];

/**
 * Check and distribute prizes for ended contests
 */
export async function distributeContestPrizes(): Promise<void> {
  try {
    const contests = await storage.getAllContests();
    const now = new Date();

    for (const contest of contests) {
      const endDate = new Date(contest.endDate);
      
      // Only process contests that have ended and are still marked as "live"
      if (now > endDate && contest.status === "live") {
        try {
          await distributePrizesForContest(contest.id);
          
          // Mark contest as ended
          await storage.updateContestStatus(contest.id, "ended");
          console.log(`✅ Contest "${contest.name}" ended and prizes distributed`);
        } catch (error) {
          console.error(`Error distributing prizes for contest ${contest.id}:`, error);
          // Continue with next contest
        }
      }
    }
  } catch (error) {
    console.error("Error in prize distribution:", error);
  }
}

/**
 * Distribute prizes for a specific contest
 */
async function distributePrizesForContest(contestId: string): Promise<void> {
  const contest = await storage.getContest(contestId);
  if (!contest) {
    throw new Error(`Contest ${contestId} not found`);
  }

  // Get leaderboard (sorted by ROI)
  const leaderboard = await storage.getContestLeaderboard(contestId);
  
  if (leaderboard.length === 0) {
    console.log(`No participants in contest ${contestId}, skipping prize distribution`);
    return;
  }

  // Calculate prize pool (entry fees collected)
  const participantCount = leaderboard.length;
  const prizePool = contest.entryFee * participantCount;

  // Determine how many winners to reward (top 3, or all if fewer than 3)
  const numWinners = Math.min(3, participantCount);
  
  // First, save final ROI for all participants
  for (const entry of leaderboard) {
    if (entry.portfolioId) {
      const portfolio = await storage.getPortfolio(entry.portfolioId);
      const finalRoi = portfolio?.roi || entry.finalRoi || 0;
      // Save final ROI to userContest record
      await storage.updateUserContestFinalRoi(entry.id, finalRoi);
    }
  }
  
  // Distribute prizes
  for (let i = 0; i < numWinners; i++) {
    const entry = leaderboard[i];
    if (!entry) continue;

    // Get final ROI (from portfolio or saved value)
    const portfolio = entry.portfolioId ? await storage.getPortfolio(entry.portfolioId) : null;
    const finalRoi = portfolio?.roi || entry.finalRoi || 0;

    // Calculate prize amount based on rank
    const prizePercentage = PRIZE_DISTRIBUTION[i]?.percentage || 0;
    const prizeAmount = Math.floor(prizePool * prizePercentage);

    if (prizeAmount > 0) {
      // Award coins to winner
      await storage.updateUserBalance(entry.userId, prizeAmount);
      console.log(
        `  🏆 Rank ${i + 1}: User ${entry.userId} won ${prizeAmount} coins ` +
        `(ROI: ${finalRoi.toFixed(2)}%)`
      );
    }
  }

  console.log(`  💰 Total prize pool distributed: ${prizePool} coins`);
}

/**
 * Check for ended contests and distribute prizes
 * Call this periodically (e.g., when market closes or every hour)
 */
export async function checkAndDistributePrizes(): Promise<void> {
  await distributeContestPrizes();
}

