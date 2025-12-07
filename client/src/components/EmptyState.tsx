import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 md:py-12 px-4 text-center">
      <Icon className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground mb-3 md:mb-4" />
      <h3 className="text-lg md:text-xl font-bold text-foreground mb-2">{title}</h3>
      <p className="text-xs md:text-sm text-muted-foreground mb-4 md:mb-6 max-w-sm">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="min-h-[44px]" data-testid="button-empty-state-action">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
