/**
 * Market Hours Utility
 * Indian Stock Market (NSE/BSE): 9:15 AM to 3:30 PM IST (Monday to Friday)
 * IST is UTC+5:30
 */

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds

/**
 * Get current IST time (returns a Date object representing IST time, but as UTC)
 */
function getISTTime(utcDate: Date = new Date()): { day: number; hours: number; minutes: number; timeInMinutes: number } {
  // Add IST offset to UTC time to get IST
  const istTimestamp = utcDate.getTime() + IST_OFFSET_MS;
  const istDate = new Date(istTimestamp);
  
  // Get UTC components (which now represent IST)
  const day = istDate.getUTCDay(); // 0 = Sunday, 6 = Saturday
  const hours = istDate.getUTCHours();
  const minutes = istDate.getUTCMinutes();
  const timeInMinutes = hours * 60 + minutes;
  
  return { day, hours, minutes, timeInMinutes };
}

/**
 * Check if Indian stock market is currently open
 */
export function isMarketOpen(): boolean {
  return isMarketOpenAtTime(new Date());
}

/**
 * Check if market is open at a specific time
 */
export function isMarketOpenAtTime(date: Date): boolean {
  const { day, timeInMinutes } = getISTTime(date);
  
  // Market is closed on weekends
  if (day === 0 || day === 6) {
    return false;
  }
  
  // Market hours: 9:15 AM (555 minutes) to 3:30 PM (930 minutes)
  const marketOpenTime = 9 * 60 + 15; // 9:15 AM
  const marketCloseTime = 15 * 60 + 30; // 3:30 PM
  
  return timeInMinutes >= marketOpenTime && timeInMinutes < marketCloseTime;
}

/**
 * Get next market open time (returns UTC Date)
 */
export function getNextMarketOpen(): Date {
  const now = new Date();
  const { day, timeInMinutes } = getISTTime(now);
  
  const marketOpenTime = 9 * 60 + 15; // 9:15 AM
  const marketCloseTime = 15 * 60 + 30; // 3:30 PM
  
  // Calculate days until next weekday
  let daysToAdd = 0;
  
  if (day === 0) {
    // Sunday - market opens Monday (1 day)
    daysToAdd = 1;
  } else if (day === 6) {
    // Saturday - market opens Monday (2 days)
    daysToAdd = 2;
  } else if (day >= 1 && day <= 5) {
    // Weekday
    if (timeInMinutes < marketOpenTime) {
      // Before market open today - market opens today
      daysToAdd = 0;
    } else if (timeInMinutes >= marketCloseTime) {
      // After market close
      if (day === 5) {
        // Friday after close - market opens Monday (3 days)
        daysToAdd = 3;
      } else {
        // Any other weekday - market opens tomorrow
        daysToAdd = 1;
      }
    } else {
      // During market hours - next open is tomorrow
      daysToAdd = 1;
    }
  }
  
  // Calculate next market open in IST
  const istTimestamp = now.getTime() + IST_OFFSET_MS;
  const istDate = new Date(istTimestamp);
  istDate.setUTCDate(istDate.getUTCDate() + daysToAdd);
  istDate.setUTCHours(9, 15, 0, 0); // 9:15 AM IST
  
  // Convert back to UTC by subtracting IST offset
  const utcTimestamp = istDate.getTime() - IST_OFFSET_MS;
  return new Date(utcTimestamp);
}

/**
 * Get time until next market open (in milliseconds)
 */
export function getMsUntilNextMarketOpen(): number {
  const now = new Date();
  const nextOpen = getNextMarketOpen();
  return nextOpen.getTime() - now.getTime();
}

/**
 * Check if we should refresh stock data based on market hours
 * During market hours: refresh every 5 minutes
 * Outside market hours: keep last data until next market open
 */
export function shouldRefreshStockData(lastUpdateTime: number): boolean {
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000;
  
  if (isMarketOpen()) {
    // During market hours: refresh every 5 minutes
    return (now - lastUpdateTime) >= fiveMinutes;
  } else {
    // Outside market hours: don't refresh (keep last data)
    return false;
  }
}
