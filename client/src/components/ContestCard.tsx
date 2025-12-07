import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Clock, Trophy, Coins } from "lucide-react";

export interface Contest {
  id: string;
  name: string;
  entryFee: number;
  prizePool: number;
  participants: number;
  maxParticipants: number;
  timeRemaining: string;
  featured?: boolean;
  closingSoon?: boolean;
  status?: "upcoming" | "live" | "ended";
  isParticipated?: boolean;
}

interface ContestCardProps {
  contest: Contest;
  onJoin?: (contestId: string) => void;
}

export function ContestCard({ contest, onJoin }: ContestCardProps) {
  return (
    <Card className="p-3 md:p-4 hover-elevate" data-testid={`card-contest-${contest.id}`}>
      <div className="flex flex-col gap-2 md:gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base md:text-lg text-foreground truncate">
              {contest.name}
            </h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {contest.featured && (
                <Badge className="text-xs px-2 py-0.5" data-testid="badge-featured">
                  Featured
                </Badge>
              )}
              {contest.closingSoon && (
                <Badge variant="destructive" className="text-xs px-2 py-0.5" data-testid="badge-closing-soon">
                  Closing Soon
                </Badge>
              )}
              {contest.status === "upcoming" && (
                <Badge variant="outline" className="text-xs px-2 py-0.5 border-primary text-primary" data-testid="badge-upcoming">
                  Upcoming
                </Badge>
              )}
              {contest.status === "ended" && (
                <Badge variant="secondary" className="text-xs px-2 py-0.5" data-testid="badge-ended">
                  Ended
                </Badge>
              )}
              {contest.isParticipated && (
                <Badge variant="outline" className="text-xs px-2 py-0.5" data-testid="badge-participated">
                  Joined
                </Badge>
              )}
            </div>
          </div>
          <Trophy className="h-4 w-4 md:h-5 md:w-5 text-primary flex-shrink-0" />
        </div>

        <div className="grid grid-cols-2 gap-2 md:gap-3">
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-xs text-muted-foreground">Entry</div>
              <div className="text-sm font-bold tabular-nums" data-testid={`text-entry-fee-${contest.id}`}>
                {contest.entryFee.toLocaleString()} coins
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-xs text-muted-foreground">Prize Pool</div>
              <div className="text-sm font-bold tabular-nums text-primary" data-testid={`text-prize-pool-${contest.id}`}>
                {contest.prizePool.toLocaleString()} coins
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-xs text-muted-foreground">Participants</div>
              <div className="text-sm font-medium tabular-nums" data-testid={`text-participants-${contest.id}`}>
                {contest.participants}/{contest.maxParticipants}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-xs text-muted-foreground">Closes in</div>
              <div className="text-sm font-medium" data-testid={`text-time-remaining-${contest.id}`}>
                {contest.timeRemaining}
              </div>
            </div>
          </div>
        </div>

        {contest.status === "ended" ? (
          <Button
            className="w-full min-h-[44px]"
            variant="secondary"
            disabled
            data-testid={`button-contest-ended-${contest.id}`}
          >
            Contest Ended
          </Button>
        ) : contest.isParticipated ? (
          <Button
            className="w-full min-h-[44px]"
            variant="outline"
            disabled
            data-testid={`button-already-joined-${contest.id}`}
          >
            Already Joined
          </Button>
        ) : (
          <Button
            className="w-full min-h-[44px]"
            onClick={() => onJoin?.(contest.id)}
            data-testid={`button-join-contest-${contest.id}`}
          >
            Join Contest
          </Button>
        )}
      </div>
    </Card>
  );
}
