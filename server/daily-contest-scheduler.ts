/**
 * Daily Contest Scheduler
 * Automatically creates tomorrow's contests when today's contests end
 * Allows users to join contests before they begin
 */

import { storage } from "./storage";

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // UTC+5:30

/**
 * Get market times for a specific date in IST
 */
function getMarketTimesForDate(date: Date): { startDate: Date; endDate: Date } {
  const istTimestamp = date.getTime() + IST_OFFSET_MS;
  const istDate = new Date(istTimestamp);
  
  // Set to 9:15 AM IST
  istDate.setUTCHours(9, 15, 0, 0);
  const startDate = new Date(istDate.getTime() - IST_OFFSET_MS);
  
  // Set to 3:30 PM IST
  istDate.setUTCHours(15, 30, 0, 0);
  const endDate = new Date(istDate.getTime() - IST_OFFSET_MS);
  
  return { startDate, endDate };
}

/**
 * Get tomorrow's date
 */
function getTomorrowDate(): Date {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  // Reset to midnight
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow;
}

/**
 * Check if a date is a weekday (Monday-Friday)
 */
function isWeekday(date: Date): boolean {
  const day = date.getDay();
  return day >= 1 && day <= 5; // Monday = 1, Friday = 5
}

/**
 * Get the next weekday (skip weekends)
 */
function getNextWeekday(date: Date): Date {
  let nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);
  
  // Skip weekends
  while (!isWeekday(nextDay)) {
    nextDay.setDate(nextDay.getDate() + 1);
  }
  
  return nextDay;
}

/**
 * Check if contests exist for a specific date
 */
async function contestsExistForDate(date: Date): Promise<boolean> {
  const { startDate } = getMarketTimesForDate(date);
  const allContests = await storage.getAllContests();
  
  // Check if any contest starts on this date
  const contestsForDate = allContests.filter((contest) => {
    const contestStart = new Date(contest.startDate);
    // Compare dates (ignore time)
    return (
      contestStart.getFullYear() === startDate.getFullYear() &&
      contestStart.getMonth() === startDate.getMonth() &&
      contestStart.getDate() === startDate.getDate()
    );
  });
  
  return contestsForDate.length >= 2; // We create 2 daily contests
}

/**
 * Create daily contests for a specific date
 */
async function createDailyContestsForDate(date: Date): Promise<void> {
  const { startDate, endDate } = getMarketTimesForDate(date);
  
  // Check if contests already exist
  if (await contestsExistForDate(date)) {
    console.log(`✅ Contests already exist for ${date.toDateString()}`);
    return;
  }
  
  console.log(`📅 Creating daily contests for ${date.toDateString()}...`);
  
  // Create 2 daily contests
  const contest1 = await storage.createContest({
    name: `Daily Stock Challenge - Morning (${date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })})`,
    description: "Join the morning trading session! Show your skills and compete for the top spot.",
    entryFee: 100,
    startingCapital: 1000000,
    duration: 1, // 1 day
    startDate,
    endDate,
    festMode: false,
    status: "upcoming", // Allow joining before start
  });

  const contest2 = await storage.createContest({
    name: `Daily Stock Challenge - Afternoon (${date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })})`,
    description: "Afternoon trading session. Make the best moves and climb the leaderboard!",
    entryFee: 50,
    startingCapital: 1000000,
    duration: 1,
    startDate,
    endDate,
    festMode: false,
    status: "upcoming", // Allow joining before start
  });

  console.log(`✅ Created contests: ${contest1.name}, ${contest2.name}`);
}

/**
 * Check and create tomorrow's contests if needed
 */
export async function checkAndCreateTomorrowContests(): Promise<void> {
  try {
    const now = new Date();
    const allContests = await storage.getAllContests();
    
    // Check if today's contests have ended
    const todayContests = allContests.filter((contest) => {
      const endDate = new Date(contest.endDate);
      const contestDate = new Date(endDate);
      contestDate.setHours(0, 0, 0, 0);
      
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      
      return contestDate.getTime() === today.getTime();
    });
    
    // Check if any today's contest has ended
    const todayContestsEnded = todayContests.some((contest) => {
      const endDate = new Date(contest.endDate);
      return now > endDate;
    });
    
    // If today's contests have ended, create tomorrow's contests
    if (todayContestsEnded || todayContests.length === 0) {
      const tomorrow = getNextWeekday(getTomorrowDate());
      
      // Only create if tomorrow is a weekday
      if (isWeekday(tomorrow)) {
        if (!(await contestsExistForDate(tomorrow))) {
          await createDailyContestsForDate(tomorrow);
        } else {
          console.log(`✅ Tomorrow's contests already exist`);
        }
      } else {
        // If tomorrow is weekend, find next weekday
        const nextWeekday = getNextWeekday(tomorrow);
        if (!(await contestsExistForDate(nextWeekday))) {
          await createDailyContestsForDate(nextWeekday);
        }
      }
    }
  } catch (error) {
    console.error("❌ Error checking and creating tomorrow's contests:", error);
  }
}

/**
 * Initialize daily contests on startup
 * Creates today's contests if they don't exist, and tomorrow's if today's have ended
 */
export async function initializeDailyContests(): Promise<void> {
  try {
    console.log("🚀 Initializing daily contests...");
    
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    
    // Check if today's contests exist
    const todayContestsExist = await contestsExistForDate(today);
    
    if (!todayContestsExist && isWeekday(today)) {
      // Create today's contests if it's a weekday
      await createDailyContestsForDate(today);
    }
    
    // Always check and create tomorrow's contests
    await checkAndCreateTomorrowContests();
    
    console.log("✅ Daily contests initialized");
  } catch (error) {
    console.error("❌ Error initializing daily contests:", error);
  }
}

/**
 * Start the daily contest scheduler
 * Checks every hour and creates tomorrow's contests when needed
 */
export function startDailyContestScheduler(): void {
  console.log("📅 Starting daily contest scheduler...");
  
  // Check immediately
  checkAndCreateTomorrowContests().catch((error) => {
    console.error("Error in initial daily contest check:", error);
  });
  
  // Check every hour
  setInterval(() => {
    checkAndCreateTomorrowContests().catch((error) => {
      console.error("Error in scheduled daily contest check:", error);
    });
  }, 60 * 60 * 1000); // Every hour
  
  console.log("✅ Daily contest scheduler started (checks every hour)");
}

