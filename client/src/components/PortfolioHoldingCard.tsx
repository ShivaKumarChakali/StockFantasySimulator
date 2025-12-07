import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

export interface PortfolioHolding {
  symbol: string;
  companyName: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  currentValue: number;
  plAmount: number;
  plPercent: number;
}

interface PortfolioHoldingCardProps {
  holding: PortfolioHolding;
}

export function PortfolioHoldingCard({ holding }: PortfolioHoldingCardProps) {
  const isProfit = holding.plAmount >= 0;

  return (
    <Card className="p-3 md:p-4 min-h-[70px] md:min-h-[80px] flex items-center" data-testid={`card-holding-${holding.symbol}`}>
      <div className="flex items-center justify-between gap-2 md:gap-4 w-full">
        <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
          <div className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-lg bg-muted text-foreground font-bold text-xs md:text-sm flex-shrink-0">
            {holding.symbol.charAt(0)}
          </div>

          <div className="min-w-0 flex-1">
            <div className="font-semibold text-sm md:text-base text-foreground truncate">{holding.symbol}</div>
            <div className="text-xs text-muted-foreground truncate">
              {holding.companyName}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {holding.quantity} shares @ ₹{holding.avgPrice.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="text-right flex-shrink-0 ml-2">
          <div className="font-bold text-sm md:text-base tabular-nums" data-testid={`text-value-${holding.symbol}`}>
            ₹{holding.currentValue.toLocaleString()}
          </div>
          <div
            className={`flex items-center justify-end gap-1 text-xs md:text-sm font-bold tabular-nums ${
              isProfit ? "text-primary" : "text-destructive"
            }`}
            data-testid={`text-pl-${holding.symbol}`}
          >
            {isProfit ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {isProfit ? "+" : ""}
            {holding.plPercent.toFixed(2)}%
          </div>
        </div>
      </div>
    </Card>
  );
}
