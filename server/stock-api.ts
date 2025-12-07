/**
 * Yahoo Finance API Integration (via RapidAPI)
 * Documentation: https://rapidapi.com/apidojo/api/yahoo-finance166
 * 
 * ⚠️ API LIMITS (Free Tier):
 * - 500 API calls per day
 * - Can fetch up to 25 stocks per request
 * 
 * We use caching and bulk fetching to optimize API usage
 */

// Cache removed - always fetch fresh data

const YAHOO_FINANCE_API_KEY = process.env.YAHOO_FINANCE_API_KEY || "b327d2b888mshea488c54b4b7cd4p1c219ejsn156b38cbdf57";
const YAHOO_FINANCE_BASE_URL = "https://yahoo-finance166.p.rapidapi.com";

// Rate limiting: 500 calls per day (Yahoo Finance via RapidAPI free tier)
// We can make calls more freely but still track usage
class RateLimiter {
  private calls: number[] = [];
  private readonly MAX_CALLS_PER_DAY = 500;
  private readonly TIME_WINDOW = 24 * 60 * 60 * 1000; // 24 hours

  canMakeCall(): boolean {
    const now = Date.now();
    // Remove calls older than 24 hours
    this.calls = this.calls.filter((timestamp) => now - timestamp < this.TIME_WINDOW);
    
    // If we have less than MAX_CALLS_PER_DAY, we can make a call
    return this.calls.length < this.MAX_CALLS_PER_DAY;
  }

  recordCall(): void {
    this.calls.push(Date.now());
  }

  getRemainingCalls(): number {
    const now = Date.now();
    this.calls = this.calls.filter((timestamp) => now - timestamp < this.TIME_WINDOW);
    return Math.max(0, this.MAX_CALLS_PER_DAY - this.calls.length);
  }
}

const rateLimiter = new RateLimiter();

export interface StockPrice {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  high?: number;
  low?: number;
  open?: number;
  close?: number;
  date?: string;
}

interface YahooFinanceQuote {
  symbol: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  regularMarketVolume: number;
  regularMarketDayHigh: number;
  regularMarketDayLow: number;
  regularMarketOpen: number;
  regularMarketPreviousClose: number;
  regularMarketTime: number;
  shortName?: string;
  longName?: string;
}

interface YahooFinanceResponse {
  quoteResponse?: {
    result: YahooFinanceQuote[];
    error: any;
  };
  // Fallback for different response format
  data?: {
    data: YahooFinanceQuote[];
    error: any;
  };
  status?: string;
}

/**
 * Format symbol for Yahoo Finance (add .NS suffix for NSE stocks)
 */
function formatSymbolForYahoo(symbol: string, exchange: string = "NSE"): string {
  // Remove any existing exchange prefix
  let cleanSymbol = symbol.replace(/^(NSE|BSE):/, "");
  
  // For NSE stocks, add .NS suffix
  if (exchange === "NSE" && !cleanSymbol.endsWith(".NS")) {
    return `${cleanSymbol}.NS`;
  }
  
  return cleanSymbol;
}

/**
 * Get stock quote from Yahoo Finance
 * @param symbol Stock symbol (e.g., "RELIANCE", "RELIANCE.NS")
 * @param exchange Exchange code (e.g., "NSE")
 */
export async function getStockEOD(
  symbol: string,
  exchange: string = "NSE"
): Promise<StockPrice | null> {
  try {
    // Check rate limit
    if (!rateLimiter.canMakeCall()) {
      console.warn(`Yahoo Finance rate limit reached. Remaining calls: ${rateLimiter.getRemainingCalls()}`);
      return null;
    }

    // Format symbol for Yahoo Finance
    const formattedSymbol = formatSymbolForYahoo(symbol, exchange);
    const url = `${YAHOO_FINANCE_BASE_URL}/api/market/get-quote?symbols=${encodeURIComponent(formattedSymbol)}`;

    // Add timeout to prevent hanging (10 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(url, {
        headers: {
          'x-rapidapi-key': YAHOO_FINANCE_API_KEY,
          'x-rapidapi-host': 'yahoo-finance166.p.rapidapi.com',
          'User-Agent': 'request'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error(`Yahoo Finance API error: ${response.status} ${response.statusText}`);
        return null;
      }

      const data: YahooFinanceResponse = await response.json();

      // Handle different response formats
      let quotes: YahooFinanceQuote[] | undefined;
      let error: any = null;

      if (data.quoteResponse) {
        // New format: { quoteResponse: { result: [...], error: ... } }
        quotes = data.quoteResponse.result;
        error = data.quoteResponse.error;
      } else if (data.data) {
        // Old format: { data: { data: [...], error: ... } }
        quotes = data.data.data;
        error = data.data.error;
      } else {
        console.error(`[Yahoo Finance] Invalid response structure for ${symbol}:`, JSON.stringify(data).substring(0, 200));
        return null;
      }

      if (error) {
        console.error(`[Yahoo Finance] API error for ${symbol}:`, error);
        return null;
      }

      if (!quotes || quotes.length === 0) {
        console.warn(`[Yahoo Finance] No data returned for ${symbol}`);
        return null;
      }

      const quote = quotes[0];

      // Validate data
      if (!quote.regularMarketPrice || !quote.symbol) {
        console.warn(`[Yahoo Finance] Missing required fields for ${symbol}:`, {
          hasPrice: !!quote.regularMarketPrice,
          hasSymbol: !!quote.symbol,
          quote: Object.keys(quote)
        });
        return null;
      }

      // Parse values
      const price = quote.regularMarketPrice;
      const change = quote.regularMarketChange || 0;
      const changePercent = quote.regularMarketChangePercent || 0;
      const volume = quote.regularMarketVolume || 0;
      const high = quote.regularMarketDayHigh;
      const low = quote.regularMarketDayLow;
      const open = quote.regularMarketOpen;
      const close = quote.regularMarketPreviousClose;

      // Format date from timestamp
      const date = quote.regularMarketTime
        ? new Date(quote.regularMarketTime * 1000).toISOString().split('T')[0]
        : undefined;

      // Remove .NS suffix from symbol for consistency
      const cleanSymbol = quote.symbol.replace(/\.NS$/, "");

      const result: StockPrice = {
        symbol: cleanSymbol,
        name: quote.longName || quote.shortName || cleanSymbol,
        price: price,
        change: change,
        changePercent: changePercent,
        volume: volume,
        high: high,
        low: low,
        open: open,
        close: close,
        date: date,
      };

      // Record API call
      rateLimiter.recordCall();

      return result;
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      // Handle timeout specifically
      if (error.name === 'AbortError') {
        console.error(`Timeout fetching stock data for ${symbol} (10s limit)`);
        return null;
      }
      
      // Handle fetch errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error(`Network error fetching stock data for ${symbol}:`, error.message);
        return null;
      }
      
      console.error(`Error fetching stock data for ${symbol}:`, error);
      return null;
    }
  } catch (error) {
    // Outer catch for any errors in rate limiting
    console.error(`Error in getStockEOD for ${symbol}:`, error);
    return null;
  }
}

/**
 * Get quotes for multiple symbols using Yahoo Finance bulk endpoint
 * Can fetch up to 25 stocks in a single request
 */
export async function getMultipleStocksEOD(
  symbols: string[],
  exchange: string = "NSE"
): Promise<StockPrice[]> {
  try {
    // Yahoo Finance can fetch up to 25 stocks per request
    // Format symbols with .NS suffix for NSE stocks
    const formattedSymbols = symbols.map(s => formatSymbolForYahoo(s, exchange));
    const MAX_BATCH_SIZE = 25;
    const batches: string[][] = [];

    // Split into batches of 25
    for (let i = 0; i < formattedSymbols.length; i += MAX_BATCH_SIZE) {
      batches.push(formattedSymbols.slice(i, i + MAX_BATCH_SIZE));
    }

    const results: StockPrice[] = [];

    // Fetch each batch
    for (const batch of batches) {
      if (!rateLimiter.canMakeCall()) {
        console.warn(`Yahoo Finance rate limit reached. Skipping batch.`);
        break;
      }

      try {
        const symbolsParam = batch.join(",");
        const url = `${YAHOO_FINANCE_BASE_URL}/api/market/get-quote?symbols=${encodeURIComponent(symbolsParam)}`;

        // Add timeout (15 seconds for bulk requests)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        try {
          const response = await fetch(url, {
            headers: {
              'x-rapidapi-key': YAHOO_FINANCE_API_KEY,
              'x-rapidapi-host': 'yahoo-finance166.p.rapidapi.com',
              'User-Agent': 'request'
            },
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            console.error(`Yahoo Finance API error: ${response.status} ${response.statusText}`);
            continue; // Continue with next batch
          }

          const data: YahooFinanceResponse = await response.json();

          // Record API call
          rateLimiter.recordCall();

          // Handle different response formats
          let quotes: YahooFinanceQuote[] | undefined;
          let error: any = null;

          if (data.quoteResponse) {
            // New format: { quoteResponse: { result: [...], error: ... } }
            quotes = data.quoteResponse.result;
            error = data.quoteResponse.error;
          } else if (data.data) {
            // Old format: { data: { data: [...], error: ... } }
            quotes = data.data.data;
            error = data.data.error;
          } else {
            console.error(`[Yahoo Finance] Invalid response structure for batch:`, JSON.stringify(data).substring(0, 200));
            continue;
          }

          if (error) {
            console.error(`[Yahoo Finance] API error for batch:`, error);
            continue;
          }

          if (!quotes || quotes.length === 0) {
            console.warn(`[Yahoo Finance] No data returned for batch`);
            continue;
          }

          // Parse each quote in the batch
          for (const quote of quotes) {
            if (!quote.regularMarketPrice || !quote.symbol) {
              continue;
            }

            // Remove .NS suffix from symbol
            const cleanSymbol = quote.symbol.replace(/\.NS$/, "");

            // Parse values
            const price = quote.regularMarketPrice;
            const change = quote.regularMarketChange || 0;
            const changePercent = quote.regularMarketChangePercent || 0;
            const volume = quote.regularMarketVolume || 0;
            const high = quote.regularMarketDayHigh;
            const low = quote.regularMarketDayLow;
            const open = quote.regularMarketOpen;
            const close = quote.regularMarketPreviousClose;

            // Format date from timestamp
            const date = quote.regularMarketTime
              ? new Date(quote.regularMarketTime * 1000).toISOString().split('T')[0]
              : undefined;

            const result: StockPrice = {
              symbol: cleanSymbol,
              name: quote.longName || quote.shortName || cleanSymbol,
              price: price,
              change: change,
              changePercent: changePercent,
              volume: volume,
              high: high,
              low: low,
              open: open,
              close: close,
              date: date,
            };

            results.push(result);
          }
        } catch (error: any) {
          clearTimeout(timeoutId);
          
          if (error.name === 'AbortError') {
            console.error(`Timeout fetching batch of stocks (15s limit)`);
          } else {
            console.error(`Error fetching batch:`, error);
          }
          // Continue with next batch
          continue;
        }
      } catch (error) {
        console.error(`Error processing batch:`, error);
        // Continue with next batch
        continue;
      }
    }

    return results;
  } catch (error) {
    console.error("Error fetching multiple stocks:", error);
    return [];
  }
}

/**
 * Get ticker information (company name, etc.)
 * Uses the STOCK_NAMES mapping or fetches from API
 */
export async function getTickerInfo(symbol: string, exchange: string = "NSE"): Promise<string | null> {
  // Try to get from stock quote first (for real-time data)
  try {
    const stock = await getStockEOD(symbol, exchange);
    if (stock && stock.name) {
      return stock.name;
    }
  } catch (error) {
    // Fall back to mapping
  }
  
  // Fall back to static mapping
  return STOCK_NAMES[symbol] || null;
}

/**
 * Popular Indian stocks (NSE symbols)
 * Can now fetch all of these in 1-2 API calls thanks to Yahoo Finance bulk endpoint
 */
export const POPULAR_INDIAN_STOCKS = [
  "RELIANCE",
  "TCS",
  "INFY",
  "HDFCBANK",
  "ICICIBANK",
  "HINDUNILVR",
  "ITC",
  "SBIN",
  "BHARTIARTL",
  "KOTAKBANK",
  "LT",
  "AXISBANK",
  "ASIANPAINT",
  "MARUTI",
  "TITAN",
  "NESTLEIND",
  "ULTRACEMCO",
  "WIPRO",
  "ONGC",
  "TATAMOTORS",
  "HCLTECH",
  "LTIM",
  "BAJAJFINSV",
  "BAJAJ-AUTO",
  "JSWSTEEL",
  "TECHM",
  "COALINDIA",
  "SUNPHARMA",
];

/**
 * Get company name mapping for Indian stocks
 * Used as fallback when API doesn't return company names
 */
export const STOCK_NAMES: Record<string, string> = {
  RELIANCE: "Reliance Industries Ltd",
  TCS: "Tata Consultancy Services",
  INFY: "Infosys Limited",
  HDFCBANK: "HDFC Bank Limited",
  ICICIBANK: "ICICI Bank Limited",
  HINDUNILVR: "Hindustan Unilever Limited",
  ITC: "ITC Limited",
  SBIN: "State Bank of India",
  BHARTIARTL: "Bharti Airtel Limited",
  KOTAKBANK: "Kotak Mahindra Bank",
  LT: "Larsen & Toubro Limited",
  AXISBANK: "Axis Bank Limited",
  ASIANPAINT: "Asian Paints Limited",
  MARUTI: "Maruti Suzuki India Limited",
  TITAN: "Titan Company Limited",
  NESTLEIND: "Nestle India Limited",
  ULTRACEMCO: "UltraTech Cement Limited",
  WIPRO: "Wipro Limited",
  ONGC: "Oil and Natural Gas Corporation",
  TATAMOTORS: "Tata Motors Limited",
  HCLTECH: "HCL Technologies Limited",
  LTIM: "L&T Infotech Limited",
  BAJAJFINSV: "Bajaj Finserv Limited",
  "BAJAJ-AUTO": "Bajaj Auto Limited",
  JSWSTEEL: "JSW Steel Limited",
  TECHM: "Tech Mahindra Limited",
  COALINDIA: "Coal India Limited",
  SUNPHARMA: "Sun Pharmaceutical Industries Limited",
};
