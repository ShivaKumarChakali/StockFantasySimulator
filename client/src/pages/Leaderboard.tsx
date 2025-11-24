import { useState } from "react";
import { LeaderboardEntry, type LeaderboardUser } from "@/components/LeaderboardEntry";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const mockLeaderboard: LeaderboardUser[] = [
  { rank: 1, userId: "1", username: "StockMaster", portfolioValue: 145000, roi: 45.2 },
  { rank: 2, userId: "2", username: "TradeWizard", portfolioValue: 138000, roi: 38.1 },
  { rank: 3, userId: "3", username: "MarketGuru", portfolioValue: 132000, roi: 32.5 },
  { rank: 4, userId: "4", username: "InvestPro", portfolioValue: 128000, roi: 28.7 },
  { rank: 5, userId: "5", username: "BullRun", portfolioValue: 125000, roi: 25.4 },
  { rank: 6, userId: "6", username: "TraderJoe", portfolioValue: 122000, roi: 22.3 },
  { rank: 7, userId: "7", username: "StockNinja", portfolioValue: 118000, roi: 18.2 },
  { rank: 8, userId: "8", username: "WealthBuilder", portfolioValue: 115000, roi: 15.8 },
];

interface College {
  id: string;
  name: string;
}

export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState("global");
  const [selectedCollege, setSelectedCollege] = useState<string>("");

  const { data: colleges = [] } = useQuery<College[]>({
    queryKey: ["/api/colleges"],
  });

  return (
    <div className="flex flex-col h-full">
      <header className="flex-shrink-0 p-4 border-b border-border bg-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Leaderboard</h1>
          </div>
        </div>

        <Tabs defaultValue="global" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="global">Global</TabsTrigger>
            <TabsTrigger value="college">College</TabsTrigger>
            <TabsTrigger value="friends">Friends</TabsTrigger>
          </TabsList>
        </Tabs>

        {activeTab === "college" && colleges.length > 0 && (
          <select
            value={selectedCollege}
            onChange={(e) => setSelectedCollege(e.target.value)}
            className="w-full mt-3 px-3 py-2 border border-input rounded-md bg-background text-sm"
            data-testid="select-college-filter"
          >
            <option value="">Select your college</option>
            {colleges.map((college) => (
              <option key={college.id} value={college.id}>
                {college.name}
              </option>
            ))}
          </select>
        )}
      </header>

      <div className="flex-1 overflow-y-auto p-4 pb-20">
        <div className="flex flex-col gap-3">
          {mockLeaderboard.map((user) => (
            <LeaderboardEntry key={user.userId} user={user} />
          ))}
        </div>
      </div>

      <div className="fixed bottom-16 left-0 right-0 p-4 bg-card/95 backdrop-blur-sm border-t border-border">
        <Button variant="outline" className="w-full" data-testid="button-view-my-rank">
          View My Rank
        </Button>
      </div>
    </div>
  );
}
