import { SearchBar } from "@/components/SearchBar";
import { StockCard, type Stock } from "@/components/StockCard";
import { Button } from "@/components/ui/button";
import { CreatePortfolioDialog } from "@/components/CreatePortfolioDialog";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Filter, Loader2 } from "lucide-react";

export default function Market() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStocks, setSelectedStocks] = useState<Set<string>>(new Set());
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Fetch stocks from API
  // Note: Backend caches data for 5 minutes, so frequent refetches are safe
  const { data: stocks = [], isLoading, error } = useQuery<Stock[]>({
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
        return response.json();
      }
    },
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
    console.log("Selected stocks:", Array.from(newSelected));
  };

  return (
    <div className="flex flex-col h-full">
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

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading stocks...</span>
          </div>
        )}

        {error && (
          <div className="text-center py-12 text-destructive">
            Failed to load stocks. Please try again.
          </div>
        )}

        {!isLoading && !error && (
          <>
            <div className="flex flex-col gap-2 md:gap-3">
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
              <div className="text-center py-12 text-sm md:text-base text-muted-foreground">
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
              className="w-full min-h-[44px]" 
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
    </div>
  );
}
