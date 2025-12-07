import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Loader2 } from "lucide-react";

export function ActiveContestsSection() {
  const { isAuthenticated, user } = useAuth();
  const [, setLocation] = useLocation();

  const userId = user?.uid;
  const { data: userContests = [], isLoading } = useQuery({
    queryKey: ["/api/users/me/contests"], // Stable key - don't include userId
    enabled: isAuthenticated && !!userId, // Use stable userId
    credentials: "include",
    // No automatic refetch - rely on WebSocket for real-time updates
    refetchOnWindowFocus: false,
    refetchInterval: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    retry: false,
    // Prevent fetch when query becomes enabled if data already exists
    placeholderData: (previousData) => previousData,
  });

  // Filter active contests (live or upcoming)
  const activeContests = userContests.filter((uc: any) => {
    const contest = uc.contest;
    if (!contest) return false;
    const now = new Date();
    const endDate = new Date(contest.endDate);
    return endDate >= now;
  });

  if (!isAuthenticated) {
    return (
      <Card className="p-6 md:p-8 text-center">
        <Trophy className="w-10 h-10 md:w-12 md:h-12 text-muted-foreground/50 mx-auto mb-3" />
        <p className="font-semibold text-sm md:text-base mb-1">Sign in to join contests</p>
        <p className="text-xs md:text-sm text-muted-foreground mb-4">
          Create an account to start competing!
        </p>
        <Button size="sm" className="min-h-[44px]" onClick={() => setLocation("/signup")}>
          Sign Up
        </Button>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="p-6 md:p-8 text-center">
        <Loader2 className="w-6 h-6 md:w-8 md:h-8 animate-spin text-primary mx-auto mb-3" />
        <p className="text-xs md:text-sm text-muted-foreground">Loading contests...</p>
      </Card>
    );
  }

  if (activeContests.length === 0) {
    return (
      <Card className="p-6 md:p-8 text-center">
        <Trophy className="w-10 h-10 md:w-12 md:h-12 text-muted-foreground/50 mx-auto mb-3" />
        <p className="font-semibold text-sm md:text-base mb-1">No Active Contests</p>
        <p className="text-xs md:text-sm text-muted-foreground mb-4">
          Join a contest to start competing!
        </p>
        <Button size="sm" className="min-h-[44px]" onClick={() => setLocation("/contests")}>
          Browse Contests
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-2 md:space-y-3">
      {activeContests.slice(0, 3).map((userContest: any) => {
        const contest = userContest.contest;
        if (!contest) return null;

        const now = new Date();
        const endDate = new Date(contest.endDate);
        const isLive = now >= new Date(contest.startDate) && now <= endDate;
        const roi = userContest.finalRoi !== null ? userContest.finalRoi : 0;

        return (
          <Card key={userContest.id} className="p-3 md:p-4 hover-elevate cursor-pointer min-h-[60px] md:min-h-[70px] flex items-center" onClick={() => setLocation("/contests")}>
            <div className="flex items-center justify-between w-full gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm md:text-base truncate">{contest.name}</h3>
                <p className="text-xs md:text-sm text-muted-foreground">
                  {isLive ? "Live" : "Upcoming"} • Rank: {userContest.rank || "—"}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-base md:text-lg font-bold text-primary tabular-nums">{roi.toFixed(2)}%</div>
                <div className="text-xs text-muted-foreground">ROI</div>
              </div>
            </div>
          </Card>
        );
      })}
      {activeContests.length > 3 && (
        <Button variant="outline" className="w-full min-h-[44px]" onClick={() => setLocation("/contests")}>
          View All {activeContests.length} Contests
        </Button>
      )}
    </div>
  );
}

