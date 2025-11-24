import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocation } from "wouter";
import { TrendingUp, Users, Trophy, Zap } from "lucide-react";

export default function Landing() {
  const [, setLocation] = useLocation();

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-b from-primary/10 to-background">
      {/* Hero Section */}
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/20 mb-4">
            <TrendingUp className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-2">Estocks</h1>
          <p className="text-lg text-muted-foreground">
            India's First College Stock Simulation Game
          </p>
        </div>

        <p className="text-base text-muted-foreground max-w-md mb-8">
          Just like Dream11, but for stock markets. Learn, compete, and dominate with virtual money. No real money risk. Just pure brain power.
        </p>

        <div className="flex flex-col gap-3 w-full max-w-sm mb-12">
          <Button
            size="lg"
            className="w-full"
            onClick={() => setLocation("/onboarding")}
            data-testid="button-get-started"
          >
            Get Started
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="w-full"
            onClick={() => setLocation("/demo")}
            data-testid="button-try-demo-landing"
          >
            Try Demo
          </Button>
          <Button
            size="lg"
            variant="ghost"
            className="w-full"
            onClick={() => setLocation("/")}
            data-testid="button-go-home"
          >
            Go to Home
          </Button>
        </div>
      </div>

      {/* Features Section */}
      <div className="px-6 py-12 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-8">Why Estocks?</h2>

        <div className="grid gap-4 mb-12">
          <Card className="p-4 hover-elevate">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold mb-1">Learn by Playing</h3>
                <p className="text-sm text-muted-foreground">
                  Gain real stock market knowledge in a risk-free environment
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4 hover-elevate">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <Trophy className="w-6 h-6 text-primary" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold mb-1">Gamified Contests</h3>
                <p className="text-sm text-muted-foreground">
                  Compete in daily/weekly sessions and climb the leaderboard
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4 hover-elevate">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold mb-1">College Competition</h3>
                <p className="text-sm text-muted-foreground">
                  Compete with your college and become a campus champion
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4 hover-elevate">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold mb-1">Build Your Profile</h3>
                <p className="text-sm text-muted-foreground">
                  Earn certificates, badges, and recognition as you grow
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Stats Section */}
      <div className="px-6 py-12 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-8">How It Works</h2>

        <div className="grid grid-cols-2 gap-4 mb-12">
          <Card className="p-6 text-center">
            <p className="text-3xl font-bold text-primary mb-2">₹10L</p>
            <p className="text-sm text-muted-foreground">Virtual Capital</p>
          </Card>

          <Card className="p-6 text-center">
            <p className="text-3xl font-bold text-primary mb-2">3-7</p>
            <p className="text-sm text-muted-foreground">Days per Contest</p>
          </Card>

          <Card className="p-6 text-center">
            <p className="text-3xl font-bold text-primary mb-2">ROI%</p>
            <p className="text-sm text-muted-foreground">Win by Returns</p>
          </Card>

          <Card className="p-6 text-center">
            <p className="text-3xl font-bold text-primary mb-2">100+</p>
            <p className="text-sm text-muted-foreground">Stocks to Trade</p>
          </Card>
        </div>
      </div>

      {/* Steps Section */}
      <div className="px-6 py-12 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-8">Get Started in 3 Steps</h2>

        <div className="space-y-4 mb-12">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
              1
            </div>
            <div>
              <h3 className="font-semibold">Create Account</h3>
              <p className="text-sm text-muted-foreground">Sign up with your college email</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
              2
            </div>
            <div>
              <h3 className="font-semibold">Pick Your Stocks</h3>
              <p className="text-sm text-muted-foreground">Build your portfolio within the budget</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
              3
            </div>
            <div>
              <h3 className="font-semibold">Compete & Win</h3>
              <p className="text-sm text-muted-foreground">Compete and rank on the leaderboard</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="px-6 py-12 pb-24">
        <Card className="p-6 text-center bg-primary/5 border-primary/20">
          <h3 className="text-lg font-semibold mb-2">Ready to Start Trading?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Join thousands of students competing in the ultimate stock trading challenge
          </p>
          <Button
            className="w-full"
            onClick={() => setLocation("/onboarding")}
            data-testid="button-start-now"
          >
            Start Now
          </Button>
        </Card>
      </div>
    </div>
  );
}
