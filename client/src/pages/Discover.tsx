import { SearchBar } from "@/components/SearchBar";
import { StockCard, type Stock } from "@/components/StockCard";
import { PortfolioHoldingCard, type PortfolioHolding } from "@/components/PortfolioHoldingCard";
import { ROIIndicator } from "@/components/ROIIndicator";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { CreatePortfolioDialog } from "@/components/CreatePortfolioDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Filter, Briefcase, Plus, Loader2 } from "lucide-react";

type TabType = "market" | "portfolio";

export default function Discover() {
  const [tab, setTab] = useState<TabType>("market");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStocks, setSelectedStocks] = useState<Set<string>>(new Set());
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { user } = useAuth();

  // Fetch user portfolios
  const { data: portfolios = [] } = useQuery<Array<{
    id: string;
    name: string;
  }>>({
    queryKey: ["/api/portfolios"],
    enabled: tab === "portfolio",
    queryFn: async () => {
      const res = await fetch("/api/portfolios", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch portfolios");
      return res.json();
    },
    refetchOnWindowFocus: false,
    refetchInterval: false,
    staleTime: 2 * 60 * 1000, // Consider data fresh for 2 minutes
    retry: false,
  });

  // Get the first portfolio (or create one if none exist)
  const portfolio = portfolios[0];

  // Fetch holdings for the portfolio
  const { data: holdings = [], isLoading: holdingsLoading } = useQuery({
    queryKey: portfolio ? ["/api/portfolios", portfolio.id, "holdings"] : [],
    queryFn: async () => {
      if (!portfolio) return [];
      const response = await fetch(`/api/portfolios/${portfolio.id}/holdings`, {
        credentials: "include",
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: tab === "portfolio" && !!portfolio,
    // No automatic refetch - rely on WebSocket for real-time updates
    refetchOnWindowFocus: false,
    refetchInterval: false,
    staleTime: 2 * 60 * 1000, // Consider data fresh for 2 minutes
    retry: false,
  });

  // Fetch stocks from API
  // Note: Backend caches data for 5 minutes, so frequent refetches are safe
  // Stocks are always fetched (not just when market tab is active) so they're ready when user switches
  const { data: stocks = [], isLoading: stocksLoading, error: stocksError } = useQuery<Stock[]>({
    queryKey: searchQuery ? ["/api/stocks/search", searchQuery] : ["/api/stocks"],
    queryFn: async () => {
      if (searchQuery) {
        const response = await fetch(`/api/stocks/search/${encodeURIComponent(searchQuery)}`, {
          credentials: "include",
        });
        if (!response.ok) return [];
        return response.json();
      } else {
        const response = await fetch("/api/stocks", {
          credentials: "include",
        });
        if (!response.ok) return [];
        const data = await response.json();
        return data;
      }
    },
    // Always enabled - stocks load immediately when Discover page mounts
    // No automatic refetch - rely on WebSocket for real-time updates
    refetchOnWindowFocus: false,
    refetchInterval: false,
    refetchOnMount: false,
    staleTime: 10 * 60 * 1000, // Consider data fresh for 10 minutes
    retry: false,
  });

  const filteredStocks = stocks.filter(
    (stock) =>
      stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stock.companyName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleStock = (symbol: string) => {
    const newSelected = new Set(selectedStocks);
    if (newSelected.has(symbol)) {
      newSelected.delete(symbol);
    } else {
      newSelected.add(symbol);
    }
    setSelectedStocks(newSelected);
  };

  // Transform holdings to PortfolioHolding format
  const portfolioHoldings: PortfolioHolding[] = holdings.map((h: any) => ({
    symbol: h.stockSymbol,
    companyName: h.companyName || h.stockSymbol,
    quantity: h.quantity,
    avgPrice: h.buyPrice,
    currentPrice: h.currentPrice,
    currentValue: h.currentValue || (h.currentPrice * h.quantity),
    plAmount: h.plAmount || (h.currentValue - (h.buyPrice * h.quantity)),
    plPercent: h.plPercent || ((h.currentValue - (h.buyPrice * h.quantity)) / (h.buyPrice * h.quantity) * 100),
  }));

  const hasHoldings = portfolioHoldings.length > 0;
  const totalInvested = portfolioHoldings.reduce((sum, h) => sum + (h.avgPrice * h.quantity), 0);
  const totalCurrent = portfolioHoldings.reduce((sum, h) => sum + h.currentValue, 0);
  const totalPL = totalCurrent - totalInvested;
  const totalROI = totalInvested !== 0 ? (totalPL / totalInvested) * 100 : 0;

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex-shrink-0 border-b border-border bg-card">
        <div className="flex gap-0">
          <button
            onClick={() => setTab("market")}
            className={`flex-1 py-3 md:py-4 px-3 md:px-4 text-sm md:text-base font-semibold border-b-2 transition-colors min-h-[44px] ${
              tab === "market"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            data-testid="tab-market"
          >
            Browse
          </button>
          <button
            onClick={() => setTab("portfolio")}
            className={`flex-1 py-3 md:py-4 px-3 md:px-4 text-sm md:text-base font-semibold border-b-2 transition-colors min-h-[44px] ${
              tab === "portfolio"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            data-testid="tab-portfolio"
          >
            Portfolio
          </button>
        </div>
      </div>

      {/* Market Tab */}
      {tab === "market" && (
        <>
          <header className="flex-shrink-0 p-4 md:p-6 border-b border-border bg-card">
            <div className="flex items-center justify-between mb-3">
              <h1 className="text-xl md:text-2xl font-bold">Stock Market</h1>
              <Button variant="ghost" size="icon" className="min-w-[44px] min-h-[44px]" data-testid="button-filter">
                <Filter className="h-5 w-5" />
              </Button>
            </div>
            <SearchBar
              placeholder="Search stocks..."
              value={searchQuery}
              onChange={setSearchQuery}
            />
          </header>

          <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-28">
            <div className="flex items-center gap-2 mb-3 md:mb-4">
              <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-primary flex-shrink-0" />
              <h2 className="text-base md:text-lg font-semibold">
                {searchQuery ? "Search Results" : "Trending Stocks"}
              </h2>
            </div>

            {stocksLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading stocks...</span>
              </div>
            )}

            {stocksError && (
              <div className="text-center py-12 text-destructive">
                Failed to load stocks. Please try again.
              </div>
            )}

            {!stocksLoading && !stocksError && (
              <>
                <div className="flex flex-col gap-3">
                  {filteredStocks.map((stock) => (
                    <StockCard
                      key={stock.symbol}
                      stock={stock}
                      selected={selectedStocks.has(stock.symbol)}
                      onToggle={handleToggleStock}
                    />
                  ))}
                </div>

                {filteredStocks.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    {searchQuery ? `No stocks found matching "${searchQuery}"` : "No stocks available"}
                  </div>
                )}
              </>
            )}
          </div>

          {selectedStocks.size > 0 && (
            <>
              <div className="fixed bottom-16 left-0 right-0 p-4 bg-card border-t border-border">
                <Button 
                  className="w-full" 
                  data-testid="button-create-portfolio"
                  onClick={() => setShowCreateDialog(true)}
                >
                  Create Portfolio ({selectedStocks.size} stocks)
                </Button>
              </div>
              <CreatePortfolioDialog
                open={showCreateDialog}
                onOpenChange={setShowCreateDialog}
                selectedStocks={stocks.filter((s) => selectedStocks.has(s.symbol))}
              />
            </>
          )}
        </>
      )}

      {/* Portfolio Tab */}
      {tab === "portfolio" && (
        <>
          {holdingsLoading ? (
            <div className="flex flex-col h-full justify-center items-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-4 text-muted-foreground">Loading portfolio...</p>
            </div>
          ) : !hasHoldings ? (
            <div className="flex flex-col h-full justify-center">
              <EmptyState
                icon={Briefcase}
                title="No Portfolio Yet"
                description="Create your first portfolio by selecting stocks from the market to start competing in contests."
                actionLabel="Browse Stocks"
                onAction={() => setTab("market")}
              />
            </div>
          ) : (
            <>
              <header className="flex-shrink-0 p-4 md:p-6 border-b border-border bg-card">
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <h1 className="text-xl md:text-2xl font-bold">My Portfolio</h1>
                  <Button 
                    size="icon" 
                    className="min-w-[44px] min-h-[44px]"
                    data-testid="button-add-portfolio"
                    onClick={() => setTab("market")}
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>

                <Card className="p-3 md:p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs md:text-sm text-muted-foreground">Total Value</div>
                      <div className="text-xl md:text-2xl font-bold tabular-nums truncate" data-testid="text-portfolio-value">
                        ₹{totalCurrent.toLocaleString()}
                      </div>
                    </div>
                    <ROIIndicator roi={totalROI} size="sm" />
                  </div>

                  <div className="grid grid-cols-2 gap-3 md:gap-4 pt-3 border-t border-border">
                    <div>
                      <div className="text-xs text-muted-foreground">Invested</div>
                      <div className="text-sm font-semibold tabular-nums">
                        ₹{totalInvested.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">P/L</div>
                      <div className={`text-sm font-semibold tabular-nums ${totalPL >= 0 ? 'text-primary' : 'text-destructive'}`}>
                        {totalPL >= 0 ? '+' : ''}₹{totalPL.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </Card>
              </header>

              <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-28">
                <h2 className="text-base md:text-lg font-semibold mb-3 md:mb-4">Holdings</h2>
                <div className="flex flex-col gap-2 md:gap-3">
                  {portfolioHoldings.map((holding) => (
                    <PortfolioHoldingCard key={holding.symbol} holding={holding} />
                  ))}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
