import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  compact?: boolean;
}

export default function EmptyState({ icon: Icon, title, description, action, compact }: EmptyStateProps) {
  if (compact) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
        <div className="rounded-full bg-muted/50 p-3 mb-3">
          <Icon className="h-8 w-8 text-muted-foreground/60" />
        </div>
        <h3 className="text-sm font-medium text-foreground mb-1">{title}</h3>
        <p className="text-xs text-muted-foreground max-w-xs">{description}</p>
        {action && (
          <Button onClick={action.onClick} variant="outline" size="sm" className="mt-3">
            {action.label}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="relative mb-6">
        {/* Decorative rings */}
        <div className="absolute inset-0 rounded-full bg-primary/5 scale-150 animate-pulse" />
        <div className="absolute inset-0 rounded-full bg-primary/10 scale-125" />
        <div className="relative rounded-full bg-gradient-to-br from-primary/10 to-primary/5 p-6 border border-primary/10">
          <Icon className="h-12 w-12 text-primary/40" />
        </div>
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground max-w-md mb-6 leading-relaxed">
        {description}
      </p>
      {action && (
        <Button onClick={action.onClick} variant="outline" className="gap-2">
          {action.label}
        </Button>
      )}
    </div>
  );
}
