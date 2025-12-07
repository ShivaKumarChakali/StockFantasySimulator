import { useState, useCallback } from "react";
import { LeaderboardEntry, type LeaderboardUser } from "@/components/LeaderboardEntry";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Loader2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useWebSocket } from "@/hooks/useWebSocket";

interface College {
  id: string;
  name: string;
}

export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState("global");
  const [selectedCollege, setSelectedCollege] = useState<string>("");
  const [selectedContest, setSelectedContest] = useState<string>("");
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: colleges = [] } = useQuery<College[]>({
    queryKey: ["/api/colleges"],
    refetchOnWindowFocus: false,
    refetchInterval: false,
    staleTime: 10 * 60 * 1000, // Consider data fresh for 10 minutes
    retry: false,
  });

  // Fetch contests for filtering
  const { data: contests = [] } = useQuery({
    queryKey: ["/api/contests"],
    refetchOnWindowFocus: false,
    refetchInterval: false,
    staleTime: 2 * 60 * 1000, // Consider data fresh for 2 minutes
    retry: false,
  });

  // Fetch global leaderboard (all contests combined)
  const { data: globalLeaderboard = [], isLoading: globalLoading } = useQuery({
    queryKey: ["/api/leaderboard/global"],
    queryFn: async () => {
      // For now, get leaderboard from all contests
      // In production, you'd have a global leaderboard endpoint
      const allContests = await fetch("/api/contests", { credentials: "include" }).then((r) => r.json());
      const allEntries: any[] = [];
      
      for (const contest of allContests) {
        const leaderboard = await fetch(`/api/leaderboard/contest/${contest.id}`, {
          credentials: "include",
        }).then((r) => r.json());
        allEntries.push(...leaderboard);
      }
      
      // Sort by ROI and add ranks
      return allEntries
        .sort((a, b) => (b.finalRoi || b.roi || 0) - (a.finalRoi || a.roi || 0))
        .slice(0, 100)
        .map((entry, index) => ({
          rank: index + 1,
          userId: entry.userId,
          username: entry.user?.username || "Unknown",
          portfolioValue: entry.portfolio?.totalValue || 0,
          roi: entry.finalRoi || entry.roi || 0,
        }));
    },
    enabled: activeTab === "global",
    refetchOnWindowFocus: false,
    refetchInterval: false,
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds (leaderboard updates more frequently)
    retry: false,
  });

  // Fetch college leaderboard
  const { data: collegeLeaderboard = [], isLoading: collegeLoading } = useQuery({
    queryKey: selectedCollege ? ["/api/leaderboard/college", selectedCollege, selectedContest] : [],
    queryFn: async () => {
      if (!selectedCollege) return [];
      const url = selectedContest
        ? `/api/leaderboard/college/${selectedCollege}?contestId=${selectedContest}`
        : `/api/leaderboard/college/${selectedCollege}`;
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) return [];
      const data = await response.json();
      return data.map((entry: any, index: number) => ({
        rank: index + 1,
        userId: entry.userId,
        username: entry.user?.username || "Unknown",
        portfolioValue: entry.portfolio?.totalValue || 0,
        roi: entry.finalRoi || entry.roi || 0,
      }));
    },
    enabled: activeTab === "college" && !!selectedCollege,
    refetchOnWindowFocus: false,
    refetchInterval: false,
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds (leaderboard updates more frequently)
    retry: false,
  });

  // Memoize WebSocket callback to prevent re-creating on every render
  const handleContestUpdate = useCallback((data: any) => {
    // Update leaderboard data directly instead of invalidating (prevents refetch)
    if (data?.leaderboard && selectedContest) {
      queryClient.setQueryData(["/api/leaderboard/contest", selectedContest], data.leaderboard);
    }
  }, [selectedContest, queryClient]);

  // WebSocket for real-time leaderboard updates
  useWebSocket({
    contestId: selectedContest || undefined,
    onContestUpdate: handleContestUpdate,
  });

  const isLoading = activeTab === "global" ? globalLoading : collegeLoading;
  const leaderboard = activeTab === "global" ? globalLeaderboard : collegeLeaderboard;

  return (
    <div className="flex flex-col h-full">
      <header className="flex-shrink-0 p-4 md:p-6 border-b border-border bg-card">
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 md:h-6 md:w-6 text-primary flex-shrink-0" />
            <h1 className="text-xl md:text-2xl font-bold">Leaderboard</h1>
          </div>
        </div>

        <Tabs defaultValue="global" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-3 h-auto">
            <TabsTrigger value="global" className="text-xs md:text-sm py-2 md:py-3 min-h-[44px]">Global</TabsTrigger>
            <TabsTrigger value="college" className="text-xs md:text-sm py-2 md:py-3 min-h-[44px]">College</TabsTrigger>
            <TabsTrigger value="friends" className="text-xs md:text-sm py-2 md:py-3 min-h-[44px]">Friends</TabsTrigger>
          </TabsList>
        </Tabs>

        {activeTab === "college" && colleges.length > 0 && (
          <div className="mt-3 space-y-2">
            <select
              value={selectedCollege}
              onChange={(e) => setSelectedCollege(e.target.value)}
              className="w-full px-3 py-2 min-h-[44px] border border-input rounded-md bg-background text-sm"
              data-testid="select-college-filter"
            >
              <option value="">Select your college</option>
              {colleges.map((college) => (
                <option key={college.id} value={college.id}>
                  {college.name}
                </option>
              ))}
            </select>
            {selectedCollege && contests.length > 0 && (
              <select
                value={selectedContest}
                onChange={(e) => setSelectedContest(e.target.value)}
                className="w-full px-3 py-2 min-h-[44px] border border-input rounded-md bg-background text-sm"
              >
                <option value="">All Contests</option>
                {contests.map((contest: any) => (
                  <option key={contest.id} value={contest.id}>
                    {contest.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-28">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 md:h-6 md:w-6 animate-spin text-primary" />
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-12 text-sm md:text-base text-muted-foreground">
            {activeTab === "college" && !selectedCollege
              ? "Select a college to view leaderboard"
              : "No entries yet"}
          </div>
        ) : (
          <div className="flex flex-col gap-2 md:gap-3">
            {leaderboard.map((user) => (
              <LeaderboardEntry key={user.userId} user={user} />
            ))}
          </div>
        )}
      </div>

      <div className="fixed bottom-16 left-0 right-0 p-4 bg-card/95 backdrop-blur-sm border-t border-border">
        <Button variant="outline" className="w-full min-h-[44px]" data-testid="button-view-my-rank">
          View My Rank
        </Button>
      </div>
    </div>
  );
}
