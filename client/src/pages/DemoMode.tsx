import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "wouter";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const demoData = [
  { day: "Day 1", value: 1000000 },
  { day: "Day 2", value: 1025000 },
  { day: "Day 3", value: 1080000 },
];

export default function DemoMode() {
  const navigate = useNavigate();
  const [roi] = useState(8.0);

  return (
    <div className="h-full flex flex-col">
      <header className="flex-shrink-0 p-4 border-b border-border bg-card">
        <h1 className="text-2xl font-bold">Demo Contest</h1>
        <p className="text-sm text-muted-foreground mt-1">Try a sample contest with virtual money</p>
      </header>

      <div className="flex-1 overflow-y-auto p-4 pb-20">
        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-2">Your Portfolio Value</h3>
            <p className="text-2xl font-bold text-green-600">₹10,80,000</p>
            <p className="text-sm text-muted-foreground">Starting: ₹10,00,000</p>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold mb-4">ROI: {roi.toFixed(2)}%</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={demoData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold mb-3">Demo Holdings</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>RELIANCE x 100</span>
                <span className="text-green-600">+₹25,000</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>INFY x 50</span>
                <span className="text-green-600">+₹5,000</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>WIPRO x 200</span>
                <span className="text-green-600">+₹10,000</span>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <p className="text-sm">
              This is a demo contest. Ready to compete for real? Create an account to join actual contests and compete with your college!
            </p>
          </Card>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 border-t border-border bg-background space-y-2">
        <Button
          className="w-full"
          size="lg"
          onClick={() => navigate("/signup")}
          data-testid="button-create-account"
        >
          Create Account & Join
        </Button>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => navigate("/")}
          data-testid="button-back-home"
        >
          Back
        </Button>
      </div>
    </div>
  );
}
