import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocation } from "wouter";
import { TrendingUp, Trophy, Users } from "lucide-react";

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [, setLocation] = useLocation();

  const steps = [
    {
      title: "Welcome to Estocks",
      subtitle: "India's First College Stock Simulation Game",
      description: "Just like Dream11, but for stock markets using virtual money.",
      icon: TrendingUp,
      color: "text-blue-500",
    },
    {
      title: "How You Play",
      subtitle: "Three Simple Steps",
      description: "Pick stocks → Build portfolio → Compete in contests → Rank on leaderboard",
      icon: Trophy,
      color: "text-amber-500",
    },
    {
      title: "What You Earn",
      subtitle: "Build Your Finance Profile",
      description: "Certificates, rankings, campus recognition, and learning!",
      icon: Users,
      color: "text-green-500",
    },
  ];

  const currentStep = steps[step];
  const CurrentIcon = currentStep.icon;

  return (
    <div className="h-full flex flex-col items-center justify-center p-4 bg-gradient-to-b from-background to-card">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-4">
          <div className={`flex justify-center ${currentStep.color}`}>
            <CurrentIcon className="h-16 w-16" />
          </div>
          <h1 className="text-3xl font-bold">{currentStep.title}</h1>
          <p className="text-lg font-semibold text-muted-foreground">{currentStep.subtitle}</p>
          <p className="text-base text-muted-foreground">{currentStep.description}</p>
        </div>

        <div className="flex gap-2 justify-center">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={`h-2 rounded-full transition-all ${
                idx === step ? "w-8 bg-primary" : "w-2 bg-muted"
              }`}
            />
          ))}
        </div>

        <div className="space-y-3">
          {step < steps.length - 1 ? (
            <>
              <Button
                className="w-full"
                size="lg"
                onClick={() => setStep(step + 1)}
                data-testid="button-next-step"
              >
                Next
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setLocation("/demo")}
                data-testid="button-try-demo"
              >
                Try Demo
              </Button>
            </>
          ) : (
            <>
              <Button
                className="w-full"
                size="lg"
                onClick={() => setLocation("/signup")}
                data-testid="button-join-contest"
              >
                Join Contest
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setLocation("/demo")}
                data-testid="button-demo-mode"
              >
                Try Demo First
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
