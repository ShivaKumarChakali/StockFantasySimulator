import { PortfolioHoldingCard, type PortfolioHolding } from "@/components/PortfolioHoldingCard";
import { ROIIndicator } from "@/components/ROIIndicator";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useWebSocket } from "@/hooks/useWebSocket";
import { Briefcase, Plus, Loader2 } from "lucide-react";
import { useCallback } from "react";

export default function Portfolio() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user portfolios
  const { data: portfolios = [], isLoading: portfoliosLoading } = useQuery({
    queryKey: ["/api/portfolios"],
    queryFn: async () => {
      const response = await fetch("/api/portfolios", {
        credentials: "include",
      });
      if (!response.ok) return [];
      return response.json();
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
    enabled: !!portfolio,
    // No automatic refetch - rely on WebSocket for real-time updates
    refetchOnWindowFocus: false,
    refetchInterval: false,
    staleTime: 2 * 60 * 1000, // Consider data fresh for 2 minutes
    retry: false,
  });

  // Memoize WebSocket callback to prevent re-creating on every render
  const handlePortfolioUpdate = useCallback((data: any) => {
    // Update queries directly with new data instead of invalidating (prevents refetch)
    if (data && portfolio?.id) {
      queryClient.setQueryData(["/api/portfolios", portfolio.id, "holdings"], data.holdings);
      queryClient.setQueryData(["/api/portfolios"], (old: any) => {
        if (!old) return old;
        return old.map((p: any) => 
          p.id === portfolio.id ? { ...p, ...data.portfolio } : p
        );
      });
    }
  }, [portfolio?.id, queryClient]);

  // WebSocket for real-time updates
  useWebSocket({
    portfolioId: portfolio?.id,
    userId: user?.uid,
    onPortfolioUpdate: handlePortfolioUpdate,
  });

  const isLoading = portfoliosLoading || holdingsLoading;
  const hasHoldings = holdings.length > 0;

  // Use portfolio ROI from database (updated by backend), or calculate if not available
  const portfolioROI = portfolio?.roi || 0;
  const portfolioTotalValue = portfolio?.totalValue || 0;

  // Calculate totals for display (fallback if portfolio data not available)
  const totalInvested = holdings.reduce((sum: number, h: any) => sum + (h.buyPrice * h.quantity), 0);
  const totalCurrent = portfolioTotalValue || holdings.reduce((sum: number, h: any) => sum + (h.currentPrice * h.quantity), 0);
  const totalPL = totalCurrent - totalInvested;
  const totalROI = portfolioROI || (totalInvested !== 0 ? (totalPL / totalInvested) * 100 : 0);

  if (isLoading) {
    return (
      <div className="flex flex-col h-full justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading portfolio...</p>
      </div>
    );
  }

  if (!portfolio || !hasHoldings) {
    return (
      <div className="flex flex-col h-full justify-center">
        <EmptyState
          icon={Briefcase}
          title="No Portfolio Yet"
          description="Create your first portfolio by selecting stocks from the market to start competing in contests."
          actionLabel="Browse Stocks"
          onAction={() => setLocation("/discover")}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex-shrink-0 p-4 md:p-6 border-b border-border bg-card">
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <h1 className="text-xl md:text-2xl font-bold">My Portfolio</h1>
          <Button 
            size="icon" 
            className="min-w-[44px] min-h-[44px]"
            data-testid="button-add-portfolio"
            onClick={() => setLocation("/discover")}
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
          {holdings.map((holding: any) => (
            <PortfolioHoldingCard 
              key={holding.id || holding.symbol} 
              holding={{
                symbol: holding.stockSymbol,
                companyName: holding.companyName || holding.stockSymbol,
                quantity: holding.quantity,
                avgPrice: holding.buyPrice,
                currentPrice: holding.currentPrice,
                currentValue: holding.currentValue || (holding.currentPrice * holding.quantity),
                plAmount: holding.plAmount || (holding.currentValue - (holding.buyPrice * holding.quantity)),
                plPercent: holding.plPercent || ((holding.currentValue - (holding.buyPrice * holding.quantity)) / (holding.buyPrice * holding.quantity) * 100),
              }} 
            />
          ))}
        </div>
      </div>
    </div>
  );
}
