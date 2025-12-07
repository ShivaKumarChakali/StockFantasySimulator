import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TrendingUp, TrendingDown, Medal } from "lucide-react";

export interface LeaderboardUser {
  rank: number;
  userId: string;
  username: string;
  portfolioValue: number;
  roi: number;
}

interface LeaderboardEntryProps {
  user: LeaderboardUser;
}

export function LeaderboardEntry({ user }: LeaderboardEntryProps) {
  const isPositive = user.roi >= 0;
  const isTopThree = user.rank <= 3;

  const getMedalColor = (rank: number) => {
    if (rank === 1) return "text-yellow-500";
    if (rank === 2) return "text-gray-400";
    if (rank === 3) return "text-amber-600";
    return "";
  };

  return (
    <Card className="p-3 min-h-[60px] md:min-h-[70px] flex items-center" data-testid={`card-leaderboard-${user.rank}`}>
      <div className="flex items-center gap-2 md:gap-3 w-full">
        <div className="flex items-center justify-center w-6 h-6 md:w-8 md:h-8 flex-shrink-0">
          {isTopThree ? (
            <Medal className={`h-5 w-5 md:h-6 md:w-6 ${getMedalColor(user.rank)}`} />
          ) : (
            <span className="text-xs md:text-sm font-bold text-muted-foreground">
              {user.rank}
            </span>
          )}
        </div>

        <Avatar className="h-8 w-8 md:h-10 md:w-10 flex-shrink-0">
          <AvatarFallback className="bg-muted text-foreground font-medium text-xs md:text-sm">
            {user.username.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm md:text-base text-foreground truncate" data-testid={`text-username-${user.rank}`}>
            {user.username}
          </div>
          <div className="text-xs text-muted-foreground tabular-nums">
            ₹{user.portfolioValue.toLocaleString()}
          </div>
        </div>

        <div className="text-right flex-shrink-0 ml-2">
          <div
            className={`flex items-center justify-end gap-1 text-sm md:text-base font-bold tabular-nums ${
              isPositive ? "text-primary" : "text-destructive"
            }`}
            data-testid={`text-roi-${user.rank}`}
          >
            {isPositive ? (
              <TrendingUp className="h-3 w-3 md:h-4 md:w-4" />
            ) : (
              <TrendingDown className="h-3 w-3 md:h-4 md:w-4" />
            )}
            {isPositive ? "+" : ""}
            {user.roi.toFixed(2)}%
          </div>
        </div>
      </div>
    </Card>
  );
}
