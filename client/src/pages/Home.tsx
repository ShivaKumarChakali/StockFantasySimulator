import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ActiveContestsSection } from "@/components/ActiveContestsSection";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Trophy, Home as HomeIcon, BarChart3, Users, Loader2 } from "lucide-react";
import type { Stock } from "@/components/StockCard";
import { apiUrl } from "@/lib/api";

export default function Home() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  // Fetch user data for balance and name
  // Use stable query key - don't include userId to prevent refetches when it changes
  const userId = user?.uid;
  const { data: userData } = useQuery({
    queryKey: ["/api/users/me"], // Stable key - don't include userId
    queryFn: async () => {
      const response = await fetch(apiUrl("/api/users/me"), {
        credentials: "include",
      });
      if (!response.ok) {
        if (userId) {
          const uidResponse = await fetch(apiUrl(`/api/users/${userId}`), {
            credentials: "include",
          });
          if (uidResponse.ok) return uidResponse.json();
        }
        return null;
      }
      return response.json();
    },
    enabled: !!userId, // Use stable userId instead of user object
    // No automatic refetch - rely on WebSocket for real-time updates
    refetchOnWindowFocus: false,
    refetchInterval: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    staleTime: 10 * 60 * 1000, // Consider data fresh for 10 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    retry: false, // Don't retry on 404
    // Prevent fetch when query becomes enabled if data already exists
    placeholderData: (previousData) => previousData,
  });

  // Fetch stocks (all stocks, not just top 3) - this pre-loads stocks for the entire app
  // Note: Backend caches data for 5 minutes, and React Query shares cache across components
  const { data: allStocks = [], isLoading } = useQuery<Stock[]>({
    queryKey: ["/api/stocks"],
    queryFn: async () => {
      const response = await fetch(apiUrl("/api/stocks"), {
        credentials: "include",
      });
      if (!response.ok) return [];
      return response.json();
    },
    // No automatic refetch - rely on WebSocket for real-time updates
    refetchOnWindowFocus: false,
    refetchInterval: false,
    refetchOnMount: false,
    staleTime: 10 * 60 * 1000, // Consider data fresh for 10 minutes
    retry: false,
  });

  // Get top 3 for display on Home page
  const stocks = allStocks.slice(0, 3);

  return (
    <div className="h-full overflow-y-auto bg-background pt-safe pb-20 md:pt-4 md:pb-32" style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 0.5rem)', paddingBottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))' }}>
      {/* Header Section */}
      <div className="bg-gradient-to-b from-primary/10 to-background p-4 md:p-6 border-b border-border/50">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
            <img 
              src="/logo.png" 
              alt="StockFantasy Logo" 
              className="h-12 w-12 md:h-20 md:w-20 lg:h-24 lg:w-24 xl:h-28 xl:w-28 rounded-lg object-contain flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <h1 className="text-lg md:text-2xl lg:text-3xl xl:text-4xl font-bold mb-1 truncate">
                Welcome back, {userData?.username || user?.displayName || user?.email?.split("@")[0] || "Trader"}! 👋
              </h1>
              <p className="text-xs md:text-base lg:text-lg xl:text-xl text-muted-foreground">Ready to practice and learn?</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-2 md:gap-3">
          <Card className="p-3 md:p-4">
            <div className="flex items-center gap-1.5 md:gap-2 mb-2">
              <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-primary">🪙</span>
              </div>
              <span className="text-xs md:text-sm lg:text-base text-muted-foreground font-medium">Coins</span>
            </div>
            <p className="text-lg md:text-2xl lg:text-3xl xl:text-4xl font-bold tabular-nums">
              {userData?.virtualBalance?.toLocaleString() || "0"}
            </p>
          </Card>

          <Card className="p-3 md:p-4">
            <div className="flex items-center gap-1.5 md:gap-2 mb-2">
              <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-primary">⭐</span>
              </div>
              <span className="text-xs md:text-sm lg:text-base text-muted-foreground font-medium">Level</span>
            </div>
            <p className="text-lg md:text-2xl lg:text-3xl xl:text-4xl font-bold">1</p>
          </Card>
        </div>

        {/* XP Progress */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs md:text-sm lg:text-base text-muted-foreground font-medium">XP Progress</span>
            <span className="text-xs md:text-sm lg:text-base text-muted-foreground">0 / 100 XP</span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full w-0 bg-primary rounded-full" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Your Active Contests */}
        <div>
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 md:w-5 md:h-5 text-primary flex-shrink-0" />
              <h2 className="text-base md:text-xl lg:text-2xl xl:text-3xl font-semibold">Your Active Contests</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/contests")}
              data-testid="link-view-all-contests"
              className="text-xs md:text-base lg:text-lg"
            >
              View All →
            </Button>
          </div>

          <ActiveContestsSection />
        </div>

        {/* Quick Actions */}
        <div>
          <div className="flex items-center gap-2 mb-3 md:mb-4">
            <span className="text-base md:text-xl lg:text-2xl xl:text-3xl font-semibold">⚡ Quick Actions</span>
          </div>

          <div className="grid grid-cols-2 gap-2 md:gap-3">
            <Button
              variant="outline"
              className="h-20 md:h-24 flex flex-col items-center justify-center gap-1.5 md:gap-2 hover-elevate min-h-[80px]"
              onClick={() => setLocation("/discover")}
              data-testid="button-browse-stocks"
            >
              <TrendingUp className="w-5 h-5 md:w-6 md:h-6" />
              <span className="text-xs md:text-sm lg:text-base">Browse & Portfolio</span>
            </Button>

            <Button
              variant="outline"
              className="h-20 md:h-24 flex flex-col items-center justify-center gap-1.5 md:gap-2 hover-elevate min-h-[80px]"
              onClick={() => setLocation("/contests")}
              data-testid="button-join-contest"
            >
              <Trophy className="w-5 h-5 md:w-6 md:h-6" />
              <span className="text-xs">Join Contest</span>
            </Button>

            <Button
              variant="outline"
              className="h-20 md:h-24 flex flex-col items-center justify-center gap-1.5 md:gap-2 hover-elevate min-h-[80px]"
              onClick={() => setLocation("/portfolio")}
              data-testid="button-portfolio-nav"
            >
              <BarChart3 className="w-5 h-5 md:w-6 md:h-6" />
              <span className="text-xs md:text-sm lg:text-base">Portfolio</span>
            </Button>

            <Button
              variant="outline"
              className="h-20 md:h-24 flex flex-col items-center justify-center gap-1.5 md:gap-2 hover-elevate min-h-[80px]"
              onClick={() => setLocation("/leaderboard")}
              data-testid="button-leaderboard-nav"
            >
              <Users className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7" />
              <span className="text-xs md:text-sm lg:text-base">Leaderboard</span>
            </Button>
          </div>
        </div>

        {/* Trending Stocks */}
        <div>
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-primary flex-shrink-0" />
              <h2 className="text-base md:text-xl lg:text-2xl xl:text-3xl font-semibold">Trending Stocks</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/market")}
              data-testid="link-view-all-stocks"
              className="text-xs md:text-base lg:text-lg"
            >
              View All →
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid gap-2 md:gap-3">
              {stocks.map((stock) => (
                <Card 
                  key={stock.symbol} 
                  className="p-3 md:p-4 hover-elevate cursor-pointer min-h-[60px] md:min-h-[70px] flex items-center"
                  onClick={() => setLocation("/discover")}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm md:text-lg lg:text-xl truncate">{stock.symbol}</p>
                      <p className="text-xs md:text-sm lg:text-base text-muted-foreground truncate">{stock.companyName}</p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className="font-semibold text-sm md:text-lg lg:text-xl tabular-nums">₹{stock.currentPrice.toFixed(2)}</p>
                      <p className={`text-xs md:text-sm lg:text-base ${stock.priceChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {stock.priceChange >= 0 ? '+' : ''}{stock.priceChangePercent.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center py-3 md:py-4 border-t border-border/50 mt-6">
          <p className="text-xs md:text-sm text-muted-foreground font-semibold mb-2">
            Educational Disclaimer
          </p>
          <p className="text-xs md:text-sm text-muted-foreground max-w-2xl mx-auto px-4">
            This platform is for educational and simulation purposes only. 
            No real money trading, financial returns, or monetary prizes are involved. 
            All trading activity is simulated using virtual currency for learning purposes.
          </p>
          <p className="text-xs md:text-sm text-muted-foreground mt-3">
            © 2024 Stock Learning Platform. Educational simulation only.
          </p>
        </div>
      </div>
    </div>
  );
}
