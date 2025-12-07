import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { BottomNav } from "@/components/BottomNav";
import Landing from "@/pages/Landing";
import Home from "@/pages/Home";
import Discover from "@/pages/Discover";
import Contests from "@/pages/Contests";
import Portfolio from "@/pages/Portfolio";
import Profile from "@/pages/Profile";
import Leaderboard from "@/pages/Leaderboard";
import Onboarding from "@/pages/Onboarding";
import CollegeSelection from "@/pages/CollegeSelection";
import DemoMode from "@/pages/DemoMode";
import Signup from "@/pages/Signup";
import Login from "@/pages/Login";
import ReferralRanking from "@/pages/ReferralRanking";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <div className="h-screen flex flex-col bg-background" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <main className="flex-1 overflow-hidden">
        <Switch>
          <Route path="/start" component={Landing} />
          <Route path="/" component={Home} />
          <Route path="/discover" component={Discover} />
          <Route path="/onboarding" component={Onboarding} />
          <Route path="/college" component={CollegeSelection} />
          <Route path="/demo" component={DemoMode} />
          <Route path="/signup" component={Signup} />
          <Route path="/login" component={Login} />
          <Route path="/referrals" component={ReferralRanking} />
          <Route path="/contests" component={Contests} />
          <Route path="/portfolio" component={Portfolio} />
          <Route path="/profile" component={Profile} />
          <Route path="/leaderboard" component={Leaderboard} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <BottomNav />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Router />
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
