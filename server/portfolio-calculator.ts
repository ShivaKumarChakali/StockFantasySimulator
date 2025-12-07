/**
 * Portfolio ROI Calculator
 * Calculates portfolio value and ROI based on current stock prices
 */

import { storage } from "./storage";
import { getMultipleStocksEOD } from "./stock-api";
import { wsManager } from "./websocket";

export interface PortfolioMetrics {
  totalInvested: number;
  totalCurrent: number;
  totalPL: number;
  roi: number;
}

/**
 * Calculate portfolio ROI based on current stock prices
 */
export async function calculatePortfolioROI(portfolioId: string): Promise<PortfolioMetrics | null> {
  try {
    // Get portfolio
    const portfolio = await storage.getPortfolio(portfolioId);
    if (!portfolio) {
      return null;
    }

    // Get all holdings
    const holdings = await storage.getHoldings(portfolioId);
    if (holdings.length === 0) {
      return {
        totalInvested: 0,
        totalCurrent: 0,
        totalPL: 0,
        roi: 0,
      };
    }

    // Get current prices for all stocks
    const symbols = holdings.map((h: any) => h.stockSymbol);
    let stockPrices;
    try {
      stockPrices = await getMultipleStocksEOD(symbols, "NSE");
    } catch (apiError) {
      console.error(`Error fetching stock prices for portfolio ${portfolioId}:`, apiError);
      // Return null if we can't get prices
      return null;
    }
    
    const priceMap = new Map(stockPrices.map((s) => [s.symbol, s.price]));

    // Calculate metrics
    let totalInvested = 0;
    let totalCurrent = 0;

    for (const holding of holdings) {
      const buyPrice = holding.buyPrice;
      const quantity = holding.quantity;
      const currentPrice = priceMap.get(holding.stockSymbol) || holding.currentPrice;

      totalInvested += buyPrice * quantity;
      totalCurrent += currentPrice * quantity;

      // Update holding's current price
      try {
        await storage.updateHoldingPrice(holding.id, currentPrice);
      } catch (updateError) {
        console.error(`Error updating holding ${holding.id} price:`, updateError);
        // Continue with calculation
      }
    }

    const totalPL = totalCurrent - totalInvested;
    const roi = totalInvested !== 0 ? (totalPL / totalInvested) * 100 : 0;

    // Update portfolio ROI and total value
    try {
      await storage.updatePortfolioROI(portfolioId, roi);
      await storage.updatePortfolioTotalValue(portfolioId, totalCurrent);
    } catch (updateError) {
      console.error(`Error updating portfolio ${portfolioId}:`, updateError);
      // Continue anyway
    }

    // Broadcast update via WebSocket (don't fail if this errors)
    try {
      wsManager.broadcastPortfolioUpdate(portfolioId, {
        totalInvested,
        totalCurrent,
        totalPL,
        roi,
      });
    } catch (wsError) {
      // WebSocket errors shouldn't stop the update
      console.error(`Error broadcasting portfolio update:`, wsError);
    }

    return {
      totalInvested,
      totalCurrent,
      totalPL,
      roi,
    };
  } catch (error) {
    console.error(`Error calculating portfolio ROI for ${portfolioId}:`, error);
    return null;
  }
}

/**
 * Update ROI for all portfolios in a contest
 */
export async function updateContestPortfolios(contestId: string): Promise<void> {
  try {
    const leaderboard = await storage.getContestLeaderboard(contestId);
    
    for (const entry of leaderboard) {
      try {
        if (entry.portfolioId) {
          await calculatePortfolioROI(entry.portfolioId);
        }
      } catch (portfolioError) {
        console.error(`Error updating portfolio ${entry.portfolioId}:`, portfolioError);
        // Continue with next portfolio
      }
    }
  } catch (error) {
    console.error(`Error updating contest portfolios for ${contestId}:`, error);
    // Don't throw - allow service to continue
  }
}

/**
 * Update ROI for all user portfolios
 */
export async function updateUserPortfolios(userId: string): Promise<void> {
  try {
    const portfolios = await storage.getUserPortfolios(userId);
    
    for (const portfolio of portfolios) {
      await calculatePortfolioROI(portfolio.id);
    }
  } catch (error) {
    console.error(`Error updating user portfolios for ${userId}:`, error);
  }
}

