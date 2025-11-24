import { SearchBar } from "@/components/SearchBar";
import { StockCard, type Stock } from "@/components/StockCard";
import { PortfolioHoldingCard, type PortfolioHolding } from "@/components/PortfolioHoldingCard";
import { ROIIndicator } from "@/components/ROIIndicator";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { useState } from "react";
import { TrendingUp, Filter, Briefcase, Plus } from "lucide-react";

const mockStocks: Stock[] = [
  { symbol: "RELIANCE", companyName: "Reliance Industries Ltd", currentPrice: 2456.75, priceChange: 34.25, priceChangePercent: 1.42 },
  { symbol: "TCS", companyName: "Tata Consultancy Services", currentPrice: 3567.80, priceChange: -12.50, priceChangePercent: -0.35 },
  { symbol: "INFY", companyName: "Infosys Limited", currentPrice: 1432.60, priceChange: 18.90, priceChangePercent: 1.34 },
  { symbol: "HDFCBANK", companyName: "HDFC Bank Limited", currentPrice: 1678.45, priceChange: 23.10, priceChangePercent: 1.39 },
  { symbol: "WIPRO", companyName: "Wipro Limited", currentPrice: 456.30, priceChange: -5.20, priceChangePercent: -1.13 },
  { symbol: "TATAMOTORS", companyName: "Tata Motors Limited", currentPrice: 789.50, priceChange: 12.75, priceChangePercent: 1.64 },
];

const mockHoldings: PortfolioHolding[] = [
  {
    symbol: "RELIANCE",
    companyName: "Reliance Industries Ltd",
    quantity: 5,
    avgPrice: 2400.00,
    currentPrice: 2456.75,
    currentValue: 12283.75,
    plAmount: 283.75,
    plPercent: 2.36,
  },
  {
    symbol: "TCS",
    companyName: "Tata Consultancy Services",
    quantity: 10,
    avgPrice: 3420.00,
    currentPrice: 3567.80,
    currentValue: 35678,
    plAmount: 1478,
    plPercent: 4.32,
  },
  {
    symbol: "INFY",
    companyName: "Infosys Limited",
    quantity: 15,
    avgPrice: 1450.00,
    currentPrice: 1432.60,
    currentValue: 21489,
    plAmount: -261,
    plPercent: -1.20,
  },
];

type TabType = "market" | "portfolio";

export default function Discover() {
  const [tab, setTab] = useState<TabType>("market");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStocks, setSelectedStocks] = useState<Set<string>>(new Set());

  const filteredStocks = mockStocks.filter(
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

  const hasHoldings = mockHoldings.length > 0;
  const totalInvested = mockHoldings.reduce((sum, h) => sum + (h.avgPrice * h.quantity), 0);
  const totalCurrent = mockHoldings.reduce((sum, h) => sum + h.currentValue, 0);
  const totalPL = totalCurrent - totalInvested;
  const totalROI = (totalPL / totalInvested) * 100;

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex-shrink-0 border-b border-border bg-card">
        <div className="flex gap-0">
          <button
            onClick={() => setTab("market")}
            className={`flex-1 py-4 px-4 font-semibold border-b-2 transition-colors ${
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
            className={`flex-1 py-4 px-4 font-semibold border-b-2 transition-colors ${
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
          <header className="flex-shrink-0 p-4 border-b border-border bg-card">
            <div className="flex items-center justify-between mb-3">
              <h1 className="text-2xl font-bold">Stock Market</h1>
              <Button variant="ghost" size="icon" data-testid="button-filter">
                <Filter className="h-5 w-5" />
              </Button>
            </div>
            <SearchBar
              placeholder="Search stocks..."
              value={searchQuery}
              onChange={setSearchQuery}
            />
          </header>

          <div className="flex-1 overflow-y-auto p-4 pb-20">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">
                {searchQuery ? "Search Results" : "Trending Stocks"}
              </h2>
            </div>

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
                No stocks found matching "{searchQuery}"
              </div>
            )}
          </div>

          {selectedStocks.size > 0 && (
            <div className="fixed bottom-16 left-0 right-0 p-4 bg-card border-t border-border">
              <Button className="w-full" data-testid="button-create-portfolio">
                Create Portfolio ({selectedStocks.size} stocks)
              </Button>
            </div>
          )}
        </>
      )}

      {/* Portfolio Tab */}
      {tab === "portfolio" && (
        <>
          {!hasHoldings ? (
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
              <header className="flex-shrink-0 p-4 border-b border-border bg-card">
                <div className="flex items-center justify-between mb-4">
                  <h1 className="text-2xl font-bold">My Portfolio</h1>
                  <Button size="icon" data-testid="button-add-portfolio">
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>

                <Card className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-sm text-muted-foreground">Total Value</div>
                      <div className="text-2xl font-bold tabular-nums" data-testid="text-portfolio-value">
                        ₹{totalCurrent.toLocaleString()}
                      </div>
                    </div>
                    <ROIIndicator roi={totalROI} size="sm" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border">
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

              <div className="flex-1 overflow-y-auto p-4 pb-20">
                <h2 className="text-lg font-semibold mb-4">Holdings</h2>
                <div className="flex flex-col gap-3">
                  {mockHoldings.map((holding) => (
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
