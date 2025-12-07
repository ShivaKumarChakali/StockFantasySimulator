import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiUrl } from "@/lib/api";

interface JoinContestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contest: {
    id: string;
    name: string;
    entryFee: number;
    startingCapital: number;
    status?: "upcoming" | "live" | "ended";
  };
}

export function JoinContestDialog({ open, onOpenChange, contest }: JoinContestDialogProps) {
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>("");
  const { isAuthenticated, user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  // Fetch user's portfolios
  const { data: portfolios = [], isLoading: portfoliosLoading } = useQuery<Array<{
    id: string;
    name: string;
    totalValue: number;
    roi: number;
  }>>({
    queryKey: ["/api/portfolios"],
    enabled: open && isAuthenticated,
    queryFn: async () => {
      const res = await fetch(apiUrl("/api/portfolios"), {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch portfolios");
      return res.json();
    },
  });

  // Fetch user data for balance check
  const { data: userData } = useQuery<{
    id: string;
    virtualBalance: number;
  } | null>({
    queryKey: user ? ["/api/users", user.uid] : [],
    queryFn: async () => {
      if (!user) return null;
      // Try to get user by Firebase UID first, then by session
      const response = await fetch(apiUrl(`/api/users/${user.uid}`), {
        credentials: "include",
      });
      if (response.ok) return response.json();
      
      // Fallback: get current user from session
      const sessionResponse = await fetch(apiUrl("/api/users/me"), {
        credentials: "include",
      });
      if (sessionResponse.ok) return sessionResponse.json();
      return null;
    },
    enabled: open && isAuthenticated && !!user,
  });

  const joinContestMutation = useMutation({
    mutationFn: async ({ contestId, portfolioId }: { contestId: string; portfolioId: string }) => {
      const response = await fetch(apiUrl(`/api/contests/${contestId}/join`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ portfolioId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to join contest");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/me/contests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.uid] });
      onOpenChange(false);
    },
  });

  const handleJoin = () => {
    if (!isAuthenticated) {
      setLocation("/login");
      return;
    }

    // Check if contest has ended
    if (contest.status === "ended") {
      alert("This contest has ended. You cannot join ended contests.");
      return;
    }

    if (!selectedPortfolioId) {
      alert("Please select a portfolio");
      return;
    }

    if (userData && userData.virtualBalance < contest.entryFee) {
      alert(`Insufficient balance. You need ${contest.entryFee.toLocaleString()} coins but have ${userData.virtualBalance.toLocaleString()} coins`);
      return;
    }

    joinContestMutation.mutate({
      contestId: contest.id,
      portfolioId: selectedPortfolioId,
    });
  };

  const hasEnoughBalance = userData && userData.virtualBalance >= contest.entryFee;
  const hasPortfolios = portfolios.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-lg p-4 md:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg md:text-xl">Join {contest.name}</DialogTitle>
          <DialogDescription className="text-xs md:text-sm">
            Select a portfolio to enter this contest. Entry fee: {contest.entryFee.toLocaleString()} coins
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 md:space-y-4 py-3 md:py-4">
          {contest.status === "ended" ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This contest has ended. You cannot join ended contests.
              </AlertDescription>
            </Alert>
          ) : !isAuthenticated ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please <Button variant="link" className="p-0 h-auto" onClick={() => setLocation("/login")}>sign in</Button> to join contests.
              </AlertDescription>
            </Alert>
          ) : portfoliosLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : !hasPortfolios ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You need to create a portfolio first.{" "}
                <Button variant="link" className="p-0 h-auto" onClick={() => { onOpenChange(false); setLocation("/discover"); }}>
                  Create Portfolio
                </Button>
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {userData && (
                <div className="p-3 md:p-4 bg-muted rounded-lg">
                  <div className="text-xs md:text-sm text-muted-foreground">Your Balance</div>
                  <div className="text-base md:text-lg font-bold tabular-nums">{userData.virtualBalance.toLocaleString()} coins</div>
                  {!hasEnoughBalance && (
                    <div className="text-xs md:text-sm text-destructive mt-1">
                      Insufficient balance. Need {contest.entryFee.toLocaleString()} coins
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="text-xs md:text-sm font-medium mb-2 block">Select Portfolio</label>
                <div className="space-y-2">
                  {portfolios.map((portfolio) => (
                    <button
                      key={portfolio.id}
                      onClick={() => setSelectedPortfolioId(portfolio.id)}
                      className={`w-full p-3 md:p-4 min-h-[60px] border rounded-lg text-left transition-colors ${
                        selectedPortfolioId === portfolio.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      <div className="font-semibold text-sm md:text-base">Portfolio #{portfolio.id.slice(0, 8)}</div>
                      <div className="text-xs md:text-sm text-muted-foreground mt-1">
                        Value: ₹{portfolio.totalValue.toLocaleString()} | ROI: {portfolio.roi.toFixed(2)}%
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 md:p-4 bg-muted rounded-lg space-y-1.5 md:space-y-2">
                <div className="flex justify-between text-xs md:text-sm">
                  <span>Entry Fee:</span>
                  <span className="font-semibold tabular-nums">{contest.entryFee.toLocaleString()} coins</span>
                </div>
                <div className="flex justify-between text-xs md:text-sm">
                  <span>Starting Capital:</span>
                  <span className="font-semibold tabular-nums">₹{contest.startingCapital.toLocaleString()}</span>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            disabled={joinContestMutation.isPending}
            className="w-full sm:w-auto min-h-[44px]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleJoin}
            disabled={
              joinContestMutation.isPending ||
              !isAuthenticated ||
              !hasPortfolios ||
              !selectedPortfolioId ||
              !hasEnoughBalance ||
              contest.status === "ended"
            }
            className="w-full sm:w-auto min-h-[44px]"
          >
            {joinContestMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Joining...
              </>
            ) : (
              "Join Contest"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

