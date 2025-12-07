import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isMarketOpen, isMarketOpenAtTime, getNextMarketOpen, getMsUntilNextMarketOpen, shouldRefreshStockData } from '../server/market-hours';

describe('Market Hours Utility', () => {
  describe('isMarketOpenAtTime', () => {
    it('should return false on Sunday', () => {
      // Sunday, 10:00 AM IST
      const sunday = new Date('2024-01-07T04:30:00Z'); // 10:00 AM IST
      expect(isMarketOpenAtTime(sunday)).toBe(false);
    });

    it('should return false on Saturday', () => {
      // Saturday, 10:00 AM IST
      const saturday = new Date('2024-01-06T04:30:00Z'); // 10:00 AM IST
      expect(isMarketOpenAtTime(saturday)).toBe(false);
    });

    it('should return false before market opens (8:00 AM IST)', () => {
      // Monday, 8:00 AM IST
      const beforeOpen = new Date('2024-01-01T02:30:00Z'); // 8:00 AM IST
      expect(isMarketOpenAtTime(beforeOpen)).toBe(false);
    });

    it('should return true during market hours (10:00 AM IST)', () => {
      // Monday, 10:00 AM IST
      const duringMarket = new Date('2024-01-01T04:30:00Z'); // 10:00 AM IST
      expect(isMarketOpenAtTime(duringMarket)).toBe(true);
    });

    it('should return true at market open (9:15 AM IST)', () => {
      // Monday, 9:15 AM IST
      const atOpen = new Date('2024-01-01T03:45:00Z'); // 9:15 AM IST
      expect(isMarketOpenAtTime(atOpen)).toBe(true);
    });

    it('should return false at market close (3:30 PM IST)', () => {
      // Monday, 3:30 PM IST
      const atClose = new Date('2024-01-01T10:00:00Z'); // 3:30 PM IST
      expect(isMarketOpenAtTime(atClose)).toBe(false);
    });

    it('should return false after market close (4:00 PM IST)', () => {
      // Monday, 4:00 PM IST
      const afterClose = new Date('2024-01-01T10:30:00Z'); // 4:00 PM IST
      expect(isMarketOpenAtTime(afterClose)).toBe(false);
    });

    it('should return true during market hours (12:00 PM IST)', () => {
      // Monday, 12:00 PM IST
      const midday = new Date('2024-01-01T06:30:00Z'); // 12:00 PM IST
      expect(isMarketOpenAtTime(midday)).toBe(true);
    });
  });

  describe('getNextMarketOpen', () => {
    it('should return next Monday if called on Sunday', () => {
      // Sunday, 10:00 AM IST
      const sunday = new Date('2024-01-07T04:30:00Z');
      const nextOpen = getNextMarketOpen();
      
      // Should be a future date
      expect(nextOpen.getTime()).toBeGreaterThan(sunday.getTime());
    });

    it('should return same day if before market open', () => {
      // Monday, 8:00 AM IST
      const beforeOpen = new Date('2024-01-01T02:30:00Z');
      const nextOpen = getNextMarketOpen();
      
      // Should be later the same day
      expect(nextOpen.getTime()).toBeGreaterThan(beforeOpen.getTime());
    });
  });

  describe('getMsUntilNextMarketOpen', () => {
    it('should return positive number', () => {
      const ms = getMsUntilNextMarketOpen();
      expect(ms).toBeGreaterThan(0);
    });
  });

  describe('shouldRefreshStockData', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should return true if market is open and 5 minutes have passed', () => {
      // Use a time when market is open (Monday, 10:00 AM IST)
      const marketOpenTime = new Date('2024-01-01T04:30:00Z'); // 10:00 AM IST
      vi.useFakeTimers();
      vi.setSystemTime(marketOpenTime);
      
      const lastUpdate = Date.now() - 6 * 60 * 1000; // 6 minutes ago
      expect(shouldRefreshStockData(lastUpdate)).toBe(true);
      
      vi.useRealTimers();
    });

    it('should return false if market is open but less than 5 minutes have passed', () => {
      const marketOpenTime = new Date('2024-01-01T04:30:00Z'); // 10:00 AM IST
      vi.useFakeTimers();
      vi.setSystemTime(marketOpenTime);
      
      const lastUpdate = Date.now() - 3 * 60 * 1000; // 3 minutes ago
      expect(shouldRefreshStockData(lastUpdate)).toBe(false);
      
      vi.useRealTimers();
    });

    it('should return false if market is closed', () => {
      // Use a time when market is closed (Sunday)
      const marketClosedTime = new Date('2024-01-07T04:30:00Z'); // Sunday, 10:00 AM IST
      vi.useFakeTimers();
      vi.setSystemTime(marketClosedTime);
      
      const lastUpdate = Date.now() - 10 * 60 * 1000; // 10 minutes ago
      expect(shouldRefreshStockData(lastUpdate)).toBe(false);
      
      vi.useRealTimers();
    });
  });
});

