import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import type { Stock } from "@/components/StockCard";

interface CreatePortfolioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedStocks: Stock[];
}

export function CreatePortfolioDialog({ open, onOpenChange, selectedStocks }: CreatePortfolioDialogProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  // Calculate total investment
  const totalInvestment = selectedStocks.reduce((sum, stock) => {
    const qty = quantities[stock.symbol] || 0;
    return sum + stock.currentPrice * qty;
  }, 0);

  const startingCapital = 1000000; // ₹10L
  const remainingCapital = startingCapital - totalInvestment;

  const createPortfolioMutation = useMutation({
    mutationFn: async (holdings: Array<{ symbol: string; quantity: number }>) => {
      // Create a map of stock prices for fallback if API fails
      const stockPrices: Record<string, number> = {};
      selectedStocks.forEach(stock => {
        stockPrices[stock.symbol] = stock.currentPrice;
      });

      const response = await fetch("/api/portfolios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ holdings, stockPrices }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to create portfolio: ${response.status} ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portfolios"] });
      onOpenChange(false);
      setLocation("/portfolio");
    },
    onError: (error: Error) => {
      console.error("Portfolio creation error:", error);
      alert(error.message || "Failed to create portfolio. Please try again.");
    },
  });

  const handleQuantityChange = (symbol: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setQuantities((prev) => ({ ...prev, [symbol]: numValue }));
  };

  const handleCreate = () => {
    if (!isAuthenticated) {
      setLocation("/login");
      return;
    }

    const holdings = selectedStocks
      .filter((stock) => (quantities[stock.symbol] || 0) > 0)
      .map((stock) => ({
        symbol: stock.symbol,
        quantity: quantities[stock.symbol] || 0,
      }));

    if (holdings.length === 0) {
      alert("Please select quantities for at least one stock");
      return;
    }

    if (totalInvestment > startingCapital) {
      alert(`Total investment (₹${totalInvestment.toLocaleString()}) exceeds starting capital (₹${startingCapital.toLocaleString()})`);
      return;
    }

    createPortfolioMutation.mutate(holdings);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto p-4 md:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg md:text-xl">Create Portfolio</DialogTitle>
          <DialogDescription className="text-xs md:text-sm">
            Select quantities for each stock. Starting capital: ₹{startingCapital.toLocaleString()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 md:space-y-4 py-3 md:py-4">
          {selectedStocks.map((stock) => {
            const qty = quantities[stock.symbol] || 0;
            const investment = stock.currentPrice * qty;

            return (
              <div key={stock.symbol} className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 p-3 md:p-4 border rounded-lg">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm md:text-base">{stock.symbol}</div>
                  <div className="text-xs md:text-sm text-muted-foreground truncate">{stock.companyName}</div>
                  <div className="text-xs md:text-sm font-medium mt-1">₹{stock.currentPrice.toFixed(2)} per share</div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Label htmlFor={`qty-${stock.symbol}`} className="text-xs md:text-sm whitespace-nowrap">
                    Qty:
                  </Label>
                  <Input
                    id={`qty-${stock.symbol}`}
                    type="number"
                    min="0"
                    value={qty}
                    onChange={(e) => handleQuantityChange(stock.symbol, e.target.value)}
                    className="w-20 md:w-24 min-h-[44px]"
                  />
                </div>

                <div className="text-right md:text-right flex-shrink-0 md:min-w-[120px]">
                  <div className="text-xs md:text-sm text-muted-foreground">Investment</div>
                  <div className="font-semibold text-sm md:text-base tabular-nums">₹{investment.toLocaleString()}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t pt-3 md:pt-4 space-y-2">
          <div className="flex justify-between text-xs md:text-sm">
            <span>Total Investment:</span>
            <span className="font-semibold tabular-nums">₹{totalInvestment.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-xs md:text-sm">
            <span>Remaining Capital:</span>
            <span className={`font-semibold tabular-nums ${remainingCapital >= 0 ? "text-primary" : "text-destructive"}`}>
              ₹{remainingCapital.toLocaleString()}
            </span>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            disabled={createPortfolioMutation.isPending}
            className="w-full sm:w-auto min-h-[44px]"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCreate} 
            disabled={createPortfolioMutation.isPending || totalInvestment === 0}
            className="w-full sm:w-auto min-h-[44px]"
          >
            {createPortfolioMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Portfolio"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

