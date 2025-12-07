import { Card } from "@/components/ui/card";

export interface Stat {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
}

interface StatsGridProps {
  stats: Stat[];
}

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="grid grid-cols-2 gap-2 md:gap-3">
      {stats.map((stat, index) => (
        <Card key={index} className="p-3 md:p-4" data-testid={`card-stat-${index}`}>
          <div className="flex items-center gap-2">
            {stat.icon && (
              <div className="text-muted-foreground flex-shrink-0">{stat.icon}</div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-xs text-muted-foreground">{stat.label}</div>
              <div className="text-base md:text-lg font-bold tabular-nums truncate" data-testid={`text-stat-value-${index}`}>
                {stat.value}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
