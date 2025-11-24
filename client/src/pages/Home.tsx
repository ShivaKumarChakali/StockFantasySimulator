import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocation } from "wouter";
import { TrendingUp, Trophy, Home as HomeIcon, BarChart3, Users } from "lucide-react";

const mockTrendingStocks = [
  { symbol: "META", name: "Meta Platforms", price: "$490.37", change: "+0.98%" },
  { symbol: "AMZN", name: "Amazon.com Inc.", price: "$156.50", change: "+0.77%" },
  { symbol: "INFY", name: "Infosys Limited", price: "$1861.+", change: "+0.65%" },
];

export default function Home() {
  const [, setLocation] = useLocation();

  return (
    <div className="h-full overflow-y-auto bg-background pb-24">
      {/* Header Section */}
      <div className="bg-gradient-to-b from-primary/10 to-background p-6 border-b border-border/50">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold mb-1">Welcome back, test! 👋</h1>
            <p className="text-sm text-muted-foreground">Ready to dominate the market?</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-xs font-bold text-primary">₹</span>
              </div>
              <span className="text-xs text-muted-foreground font-medium">Coins</span>
            </div>
            <p className="text-xl font-bold">15,000</p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-xs font-bold text-primary">⭐</span>
              </div>
              <span className="text-xs text-muted-foreground font-medium">Level</span>
            </div>
            <p className="text-xl font-bold">1</p>
          </Card>
        </div>

        {/* XP Progress */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground font-medium">XP Progress</span>
            <span className="text-xs text-muted-foreground">0 / 100 XP</span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full w-0 bg-primary rounded-full" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Your Active Contests */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Your Active Contests</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/contests")}
              data-testid="link-view-all-contests"
            >
              View All →
            </Button>
          </div>

          <Card className="p-8 text-center">
            <Trophy className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="font-semibold mb-1">No Active Contests</p>
            <p className="text-sm text-muted-foreground mb-4">
              Check back soon for new contests!
            </p>
            <Button
              size="sm"
              onClick={() => setLocation("/contests")}
              data-testid="button-create-portfolio"
            >
              Create Portfolio
            </Button>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg font-semibold">⚡ Quick Actions</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center gap-2 hover-elevate"
              onClick={() => setLocation("/discover")}
              data-testid="button-browse-stocks"
            >
              <TrendingUp className="w-6 h-6" />
              <span className="text-xs">Browse & Portfolio</span>
            </Button>

            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center gap-2 hover-elevate"
              onClick={() => setLocation("/contests")}
              data-testid="button-join-contest"
            >
              <Trophy className="w-6 h-6" />
              <span className="text-xs">Join Contest</span>
            </Button>

            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center gap-2 hover-elevate"
              onClick={() => setLocation("/portfolio")}
              data-testid="button-portfolio-nav"
            >
              <BarChart3 className="w-6 h-6" />
              <span className="text-xs">Portfolio</span>
            </Button>

            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center gap-2 hover-elevate"
              onClick={() => setLocation("/leaderboard")}
              data-testid="button-leaderboard-nav"
            >
              <Users className="w-6 h-6" />
              <span className="text-xs">Leaderboard</span>
            </Button>
          </div>
        </div>

        {/* Trending Stocks */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Trending Stocks</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/market")}
              data-testid="link-view-all-stocks"
            >
              View All →
            </Button>
          </div>

          <div className="grid gap-3">
            {mockTrendingStocks.map((stock) => (
              <Card 
                key={stock.symbol} 
                className="p-4 hover-elevate cursor-pointer"
                onClick={() => setLocation("/discover")}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{stock.symbol}</p>
                    <p className="text-xs text-muted-foreground">{stock.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{stock.price}</p>
                    <p className="text-xs text-green-600 dark:text-green-400">
                      {stock.change}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-4">
          <p className="text-xs text-muted-foreground">
            © 2024 TRADE UP. Fantasy trading for educational purposes.
          </p>
          <p className="text-xs text-muted-foreground">
            Not real money. Not real stocks. Real learning.
          </p>
        </div>
      </div>
    </div>
  );
}
