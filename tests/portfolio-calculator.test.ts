import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculatePortfolioROI } from '../server/portfolio-calculator';
import { storage } from '../server/storage';
import { getMultipleStocksEOD } from '../server/stock-api';
import { wsManager } from '../server/websocket';

// Mock dependencies
vi.mock('../server/storage');
vi.mock('../server/stock-api');
vi.mock('../server/websocket', () => ({
  wsManager: {
    broadcastPortfolioUpdate: vi.fn(),
  },
}));

describe('Portfolio Calculator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should calculate ROI correctly for profitable portfolio', async () => {
    const portfolioId = 'portfolio-1';
    const portfolio = {
      id: portfolioId,
      userId: 'user1',
      name: 'Test Portfolio',
      startingCapital: 1000000,
      roi: 0,
      totalValue: 0,
    };

    const holdings = [
      {
        id: 'h1',
        portfolioId,
        stockSymbol: 'RELIANCE',
        quantity: 10,
        buyPrice: 1000,
        currentPrice: 1100,
      },
      {
        id: 'h2',
        portfolioId,
        stockSymbol: 'TCS',
        quantity: 5,
        buyPrice: 2000,
        currentPrice: 2100,
      },
    ];

    const stockPrices = [
      { symbol: 'RELIANCE', price: 1100 },
      { symbol: 'TCS', price: 2100 },
    ];

    vi.mocked(storage.getPortfolio).mockResolvedValue(portfolio as any);
    vi.mocked(storage.getHoldings).mockResolvedValue(holdings as any);
    vi.mocked(getMultipleStocksEOD).mockResolvedValue(stockPrices as any);
    vi.mocked(storage.updateHoldingPrice).mockResolvedValue(undefined);
    vi.mocked(storage.updatePortfolioROI).mockResolvedValue(undefined);
    vi.mocked(storage.updatePortfolioTotalValue).mockResolvedValue(undefined);

    const result = await calculatePortfolioROI(portfolioId);

    // Total invested: (10 * 1000) + (5 * 2000) = 20,000
    // Total current: (10 * 1100) + (5 * 2100) = 21,500
    // Total PL: 1,500
    // ROI: (1,500 / 20,000) * 100 = 7.5%

    expect(result).not.toBeNull();
    expect(result?.totalInvested).toBe(20000);
    expect(result?.totalCurrent).toBe(21500);
    expect(result?.totalPL).toBe(1500);
    expect(result?.roi).toBeCloseTo(7.5, 1);
  });

  it('should calculate ROI correctly for loss-making portfolio', async () => {
    const portfolioId = 'portfolio-2';
    const portfolio = {
      id: portfolioId,
      userId: 'user1',
      name: 'Test Portfolio',
      startingCapital: 1000000,
      roi: 0,
      totalValue: 0,
    };

    const holdings = [
      {
        id: 'h1',
        portfolioId,
        stockSymbol: 'RELIANCE',
        quantity: 10,
        buyPrice: 1000,
        currentPrice: 900,
      },
    ];

    const stockPrices = [
      { symbol: 'RELIANCE', price: 900 },
    ];

    vi.mocked(storage.getPortfolio).mockResolvedValue(portfolio as any);
    vi.mocked(storage.getHoldings).mockResolvedValue(holdings as any);
    vi.mocked(getMultipleStocksEOD).mockResolvedValue(stockPrices as any);
    vi.mocked(storage.updateHoldingPrice).mockResolvedValue(undefined);
    vi.mocked(storage.updatePortfolioROI).mockResolvedValue(undefined);
    vi.mocked(storage.updatePortfolioTotalValue).mockResolvedValue(undefined);

    const result = await calculatePortfolioROI(portfolioId);

    // Total invested: 10 * 1000 = 10,000
    // Total current: 10 * 900 = 9,000
    // Total PL: -1,000
    // ROI: (-1,000 / 10,000) * 100 = -10%

    expect(result).not.toBeNull();
    expect(result?.totalInvested).toBe(10000);
    expect(result?.totalCurrent).toBe(9000);
    expect(result?.totalPL).toBe(-1000);
    expect(result?.roi).toBeCloseTo(-10, 1);
  });

  it('should return null if portfolio not found', async () => {
    vi.mocked(storage.getPortfolio).mockResolvedValue(undefined);

    const result = await calculatePortfolioROI('non-existent');
    expect(result).toBeNull();
  });

  it('should return zero metrics for portfolio with no holdings', async () => {
    const portfolioId = 'portfolio-3';
    const portfolio = {
      id: portfolioId,
      userId: 'user1',
      name: 'Test Portfolio',
      startingCapital: 1000000,
      roi: 0,
      totalValue: 0,
    };

    vi.mocked(storage.getPortfolio).mockResolvedValue(portfolio as any);
    vi.mocked(storage.getHoldings).mockResolvedValue([]);

    const result = await calculatePortfolioROI(portfolioId);

    expect(result).toEqual({
      totalInvested: 0,
      totalCurrent: 0,
      totalPL: 0,
      roi: 0,
    });
  });

  it('should return null if stock API fails', async () => {
    const portfolioId = 'portfolio-4';
    const portfolio = {
      id: portfolioId,
      userId: 'user1',
      name: 'Test Portfolio',
      startingCapital: 1000000,
      roi: 0,
      totalValue: 0,
    };

    const holdings = [
      {
        id: 'h1',
        portfolioId,
        stockSymbol: 'RELIANCE',
        quantity: 10,
        buyPrice: 1000,
        currentPrice: 1000,
      },
    ];

    vi.mocked(storage.getPortfolio).mockResolvedValue(portfolio as any);
    vi.mocked(storage.getHoldings).mockResolvedValue(holdings as any);
    vi.mocked(getMultipleStocksEOD).mockRejectedValue(new Error('API Error'));

    const result = await calculatePortfolioROI(portfolioId);
    expect(result).toBeNull();
  });
});

