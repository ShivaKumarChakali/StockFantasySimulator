import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Gift, Star } from "lucide-react";

interface TopReferrer {
  id: string;
  username: string;
  referralCount: number;
}

export default function ReferralRanking() {
  const { data: topReferrers = [], isLoading } = useQuery<TopReferrer[]>({
    queryKey: ["/api/referrals/top"],
  });

  const getMedalColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "text-yellow-500";
      case 2:
        return "text-gray-400";
      case 3:
        return "text-orange-600";
      default:
        return "text-muted-foreground";
    }
  };

  const getMedalIcon = (rank: number) => {
    if (rank <= 3) {
      return <Trophy className={`h-5 w-5 ${getMedalColor(rank)}`} />;
    }
    return <Star className="h-5 w-5 text-muted-foreground" />;
  };

  return (
    <div className="h-full flex flex-col">
      <header className="flex-shrink-0 p-4 border-b border-border bg-card">
        <h1 className="text-2xl font-bold">Referral Leaderboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Invite friends and get exclusive rewards
        </p>
      </header>

      <div className="flex-1 overflow-y-auto p-4 pb-20">
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="font-semibold text-sm">Exclusive Rewards</p>
              <p className="text-xs text-muted-foreground">
                Top 3 ambassadors get special certificates
              </p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">Loading leaderboard...</div>
        ) : topReferrers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No referrals yet. Start inviting friends!
          </div>
        ) : (
          <div className="space-y-2">
            {topReferrers.map((referrer, index) => (
              <Card
                key={referrer.id}
                className="p-4 flex items-center justify-between hover-elevate"
                data-testid={`card-referrer-${index}`}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex items-center justify-center w-8">
                    {getMedalIcon(index + 1)}
                  </div>
                  <div>
                    <p className="font-semibold">{referrer.username}</p>
                    <p className="text-xs text-muted-foreground">Rank #{index + 1}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className="mb-1">{referrer.referralCount} referrals</Badge>
                  {index < 3 && (
                    <div className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                      🏅 Certificate
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
