import { cn } from "@/lib/utils";
import { Lightbulb } from "lucide-react";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  tip?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, tip, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center py-16 px-6 max-w-md mx-auto", className)}>
      <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-5">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed mb-1">{description}</p>
      {tip && (
        <p className="text-xs text-muted-foreground mt-2 bg-card border border-border rounded-lg px-3 py-2 flex items-center gap-1.5">
          <Lightbulb className="h-3 w-3 text-primary shrink-0" />
          {tip}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
