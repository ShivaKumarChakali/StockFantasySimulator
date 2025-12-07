import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatsGrid } from "@/components/StatsGrid";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LeaderboardEntry, type LeaderboardUser } from "@/components/LeaderboardEntry";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { Trophy, TrendingUp, Target, Award, Settings, LogOut, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { format } from "date-fns";

export default function Profile() {
  const { user: firebaseUser, logout } = useAuth();
  const [, setLocation] = useLocation();

  const userId = firebaseUser?.uid;
  
  // Fetch user data from backend
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ["/api/users/me"], // Stable key - don't include userId
    queryFn: async () => {
      const response = await fetch("/api/users/me", {
        credentials: "include",
      });
      if (!response.ok) {
        // Try fetching by Firebase UID
        if (userId) {
          const uidResponse = await fetch(`/api/users/${userId}`, {
            credentials: "include",
          });
          if (uidResponse.ok) return uidResponse.json();
        }
        throw new Error("Failed to fetch user data");
      }
      return response.json();
    },
    enabled: !!userId,
    refetchOnWindowFocus: false,
    refetchInterval: false,
    refetchOnMount: false,
    staleTime: 10 * 60 * 1000,
    retry: false,
  });

  // Fetch user contests for statistics
  const { data: userContests = [] } = useQuery({
    queryKey: ["/api/users/me/contests"], // Stable key - don't include userId
    queryFn: async () => {
      const response = await fetch("/api/users/me/contests", {
        credentials: "include",
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!userId,
    refetchOnWindowFocus: false,
    refetchInterval: false,
    refetchOnMount: false,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  // Fetch user portfolios for ROI calculation
  const { data: portfolios = [] } = useQuery<Array<{
    id: string;
    roi: number | null;
  }>>({
    queryKey: ["/api/portfolios"], // Stable key - don't include userId
    enabled: !!userId,
    queryFn: async () => {
      const res = await fetch("/api/portfolios", {
        credentials: "include",
      });
      if (!res.ok) return [];
      return res.json();
    },
    refetchOnWindowFocus: false,
    refetchInterval: false,
    refetchOnMount: false,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const handleLogout = async () => {
    try {
      await logout();
      setLocation("/start");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Calculate statistics
  const contestsPlayed = userContests.length;
  const totalROI = portfolios.length > 0
    ? portfolios.reduce((sum: number, p) => sum + (p.roi || 0), 0) / portfolios.length
    : 0;
  
  // Get best rank from contests
  const bestRank = userContests.length > 0
    ? Math.min(...userContests.map((uc: any) => uc.rank || 999).filter((r: number) => r > 0))
    : null;

  const stats = [
    { label: "Contests Played", value: contestsPlayed.toString(), icon: <Trophy className="h-4 w-4" /> },
    { label: "Win Rate", value: contestsPlayed > 0 ? "—" : "—", icon: <Target className="h-4 w-4" /> },
    { label: "Total ROI", value: `${totalROI >= 0 ? "+" : ""}${totalROI.toFixed(1)}%`, icon: <TrendingUp className="h-4 w-4" /> },
    { label: "Best Rank", value: bestRank ? `${bestRank}${bestRank === 1 ? "st" : bestRank === 2 ? "nd" : bestRank === 3 ? "rd" : "th"}` : "—", icon: <Award className="h-4 w-4" /> },
  ];

  // Get recent performance from contests
  const recentPerformance: LeaderboardUser[] = userContests
    .slice(0, 3)
    .map((uc: any, index: number) => ({
      rank: uc.rank || index + 1,
      userId: userData?.id || "",
      username: userData?.username || firebaseUser?.displayName || "User",
      portfolioValue: uc.portfolio?.totalValue || 0,
      roi: uc.finalRoi || uc.roi || 0,
    }));

  if (userLoading) {
    return (
      <div className="flex flex-col h-full justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  const displayUser = {
    username: userData?.username || firebaseUser?.displayName || firebaseUser?.email?.split("@")[0] || "User",
    email: userData?.email || firebaseUser?.email || "",
    joinDate: userData?.createdAt ? format(new Date(userData.createdAt), "MMM yyyy") : "Recently",
  };
  return (
    <div className="flex flex-col h-full">
      <header className="flex-shrink-0 p-4 md:p-6 border-b border-border bg-card">
        <div className="flex items-center justify-between">
          <h1 className="text-xl md:text-2xl font-bold">Profile</h1>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="icon" className="min-w-[44px] min-h-[44px]" data-testid="button-settings">
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-28">
        <Card className="p-4 md:p-6 mb-4 md:mb-6">
          <div className="flex items-center gap-3 md:gap-4 mb-4">
            <Avatar className="h-16 w-16 md:h-20 md:w-20 flex-shrink-0">
              <AvatarFallback className="bg-primary text-primary-foreground text-xl md:text-2xl font-bold">
                {displayUser.username.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg md:text-xl font-bold truncate" data-testid="text-username">
                {displayUser.username}
              </h2>
              {displayUser.email && (
                <p className="text-xs md:text-sm text-muted-foreground truncate">{displayUser.email}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Member since {displayUser.joinDate}
              </p>
            </div>
          </div>
          <Button variant="outline" className="w-full min-h-[44px]" data-testid="button-edit-profile">
            Edit Profile
          </Button>
        </Card>

        <div className="mb-4 md:mb-6">
          <h3 className="text-base md:text-lg font-semibold mb-3">Statistics</h3>
          <StatsGrid stats={stats} />
        </div>

        <div className="mb-4 md:mb-6">
          <h3 className="text-base md:text-lg font-semibold mb-3">Recent Performance</h3>
          {recentPerformance.length > 0 ? (
            <div className="flex flex-col gap-2 md:gap-3">
              {recentPerformance.map((perf, index) => (
                <LeaderboardEntry key={index} user={perf} />
              ))}
            </div>
          ) : (
            <Card className="p-4 md:p-6 text-center text-sm md:text-base text-muted-foreground">
              <p>No contest performance yet. Join a contest to see your rankings!</p>
            </Card>
          )}
        </div>

        <div className="space-y-2 md:space-y-3">
          <Button variant="outline" className="w-full justify-start min-h-[44px]" data-testid="button-transaction-history">
            Transaction History
          </Button>
          <Button variant="outline" className="w-full justify-start min-h-[44px]" data-testid="button-help">
            Help & Support
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start min-h-[44px] text-destructive hover:text-destructive" 
            data-testid="button-logout"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}
