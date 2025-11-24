import { Home as HomeIcon, TrendingUp, Trophy, Award, User } from "lucide-react";
import { useLocation } from "wouter";

const navItems = [
  { label: "Home", icon: HomeIcon, path: "/" },
  { label: "Discover", icon: TrendingUp, path: "/discover" },
  { label: "Contests", icon: Trophy, path: "/contests" },
  { label: "Leaderboard", icon: Award, path: "/leaderboard" },
  { label: "Profile", icon: User, path: "/profile" },
];

export function BottomNav() {
  const [location, setLocation] = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-card h-16 flex items-center justify-around">
      {navItems.map(({ label, icon: Icon, path }) => (
        <button
          key={path}
          onClick={() => setLocation(path)}
          className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${
            location === path
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
          data-testid={`nav-${label.toLowerCase()}`}
        >
          <Icon className="h-5 w-5" />
          <span className="text-xs font-medium">{label}</span>
        </button>
      ))}
    </div>
  );
}
