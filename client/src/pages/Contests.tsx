import { ContestCard, type Contest } from "@/components/ContestCard";
import { CoinBalance } from "@/components/CoinBalance";
import { JoinContestDialog } from "@/components/JoinContestDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { Clock, Zap, Loader2 } from "lucide-react";

export default function Contests() {
  const [selectedContest, setSelectedContest] = useState<any>(null);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [filter, setFilter] = useState<"all" | "featured" | "closing">("all");
  const { isAuthenticated, user } = useAuth();

  // Fetch contests
  const { data: contests = [], isLoading } = useQuery<Array<{
    id: string;
    name: string;
    entryFee: number;
    prizePool?: number;
    participants?: number;
    timeRemaining?: string;
    festMode?: boolean;
    featured?: boolean;
    closingSoon?: boolean;
    status?: string;
    endDate: string;
  }>>({
    queryKey: ["/api/contests"],
    queryFn: async () => {
      const res = await fetch(apiUrl("/api/contests"), {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch contests");
      return res.json();
    },
    // No automatic refetch - rely on WebSocket for real-time updates
    refetchOnWindowFocus: false,
    refetchInterval: false,
    staleTime: 2 * 60 * 1000, // Consider data fresh for 2 minutes
    retry: false,
  });

  // Fetch user's contests to check participation
  const { data: userContests = [] } = useQuery<Array<{
    contestId: string;
    contest?: { id: string };
  }>>({
    queryKey: ["/api/users/me/contests"],
    enabled: isAuthenticated && !!user,
    queryFn: async () => {
      const res = await fetch(apiUrl("/api/users/me/contests"), {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch contests");
      return res.json();
    },
    refetchOnWindowFocus: false,
    refetchInterval: false,
    staleTime: 2 * 60 * 1000,
    retry: false,
  });

  // Fetch user balance
  const { data: userData } = useQuery<{
    virtualBalance: number;
  }>({
    queryKey: user ? ["/api/users", user.uid] : [],
    enabled: isAuthenticated && !!user,
      queryFn: async () => {
        if (!user) return { virtualBalance: 0 };
        const res = await fetch(apiUrl(`/api/users/${user.uid}`), {
          credentials: "include",
        });
        if (!res.ok) {
          // Fallback to session endpoint
          const sessionRes = await fetch(apiUrl("/api/users/me"), {
            credentials: "include",
          });
          if (!sessionRes.ok) return { virtualBalance: 0 };
          return sessionRes.json();
        }
        return res.json();
      },
    refetchOnWindowFocus: false,
    refetchInterval: false,
    staleTime: 2 * 60 * 1000, // Consider data fresh for 2 minutes
    retry: false,
  });

  const handleJoinContest = (contest: any) => {
    setSelectedContest(contest);
    setShowJoinDialog(true);
  };

  // Create a set of contest IDs the user has participated in
  const participatedContestIds = new Set(
    userContests.map((uc) => uc.contestId || uc.contest?.id)
  );

  // Filter contests - exclude ended contests by default (unless showing "all")
  const filteredContests = contests.filter((contest) => {
    // Filter by status
    if (filter === "featured") return contest.festMode || contest.featured;
    if (filter === "closing") return contest.closingSoon;
    
    // For "all" filter, show all contests (including ended ones)
    // You can change this to exclude ended: return contest.status !== "ended";
    return true;
  });

  // Transform API data to Contest interface
  const transformedContests: Contest[] = filteredContests.map((contest: any) => ({
    id: contest.id,
    name: contest.name,
    entryFee: contest.entryFee,
    prizePool: contest.prizePool || contest.entryFee * (contest.participants || 0),
    participants: contest.participants || 0,
    maxParticipants: 10000, // No limit for now
    timeRemaining: contest.timeRemaining || "N/A",
    featured: contest.festMode || false,
    closingSoon: contest.closingSoon || false,
    status: contest.status || "upcoming",
    isParticipated: participatedContestIds.has(contest.id),
  }));

  return (
    <div className="flex flex-col h-full">
      <header className="flex-shrink-0 p-4 md:p-6 border-b border-border bg-card">
        <div className="flex items-center justify-between mb-3 md:mb-4 gap-2">
          <h1 className="text-xl md:text-2xl font-bold">Contests</h1>
          <CoinBalance balance={userData?.virtualBalance || 0} />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
          <Badge
            className={`flex-shrink-0 px-3 py-1.5 md:px-4 md:py-2 min-h-[36px] cursor-pointer hover-elevate active-elevate-2 text-xs md:text-sm ${
              filter === "all" ? "" : "variant-outline"
            }`}
            onClick={() => setFilter("all")}
            data-testid="badge-filter-all"
          >
            <Zap className="h-3 w-3 md:h-4 md:w-4 mr-1" />
            All
          </Badge>
          <Badge
            variant={filter === "featured" ? "default" : "outline"}
            className="flex-shrink-0 px-3 py-1.5 md:px-4 md:py-2 min-h-[36px] cursor-pointer hover-elevate active-elevate-2 text-xs md:text-sm"
            onClick={() => setFilter("featured")}
            data-testid="badge-filter-featured"
          >
            Featured
          </Badge>
          <Badge
            variant={filter === "closing" ? "default" : "outline"}
            className="flex-shrink-0 px-3 py-1.5 md:px-4 md:py-2 min-h-[36px] cursor-pointer hover-elevate active-elevate-2 text-xs md:text-sm"
            onClick={() => setFilter("closing")}
            data-testid="badge-filter-closing"
          >
            <Clock className="h-3 w-3 md:h-4 md:w-4 mr-1" />
            Closing Soon
          </Badge>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-28" style={{ paddingBottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))' }}>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 md:h-6 md:w-6 animate-spin text-primary" />
          </div>
        ) : transformedContests.length === 0 ? (
          <div className="text-center py-12 text-sm md:text-base text-muted-foreground">
            No contests available
          </div>
        ) : (
          <div className="flex flex-col gap-3 md:gap-4">
            {transformedContests.map((contest) => {
              const originalContest = filteredContests.find((c: any) => c.id === contest.id);
              return (
                <ContestCard
                  key={contest.id}
                  contest={contest}
                  onJoin={() => handleJoinContest(originalContest)}
                />
              );
            })}
          </div>
        )}
      </div>

      {selectedContest && (
        <JoinContestDialog
          open={showJoinDialog}
          onOpenChange={setShowJoinDialog}
          contest={selectedContest}
        />
      )}

      <div className="fixed left-0 right-0 p-4 bg-card/95 backdrop-blur-sm border-t border-border z-40" style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))' }}>
        <Button 
          variant="outline" 
          className="w-full min-h-[44px]" 
          onClick={() => {
            // Filter to show only user's contests
            const myContests = transformedContests.filter(c => c.isParticipated);
            if (myContests.length > 0) {
              // You could navigate to a "My Contests" page or filter here
              // For now, we'll just show a message
              alert(`You have ${myContests.length} contest(s) you've joined. They appear in "Your Active Contests" on the home page.`);
            } else {
              alert("You haven't joined any contests yet.");
            }
          }}
          data-testid="button-view-my-contests"
        >
          View My Contests ({userContests.length})
        </Button>
      </div>
    </div>
  );
}
