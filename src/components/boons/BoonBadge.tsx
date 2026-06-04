import { Badge } from "@/components/ui/badge";
import { BoonSeverity, BoonStatus } from "@/hooks/useBoons";

interface BoonBadgeProps {
  severity: BoonSeverity;
  size?: "sm" | "default";
}

export function BoonBadge({ severity, size = "default" }: BoonBadgeProps) {
  const severityConfig = {
    trivial: { label: "Trivial", className: "bg-muted/20 text-muted-foreground border-muted/50" },
    minor: { label: "Minor", className: "bg-info/20 text-info border-info/50" },
    major: { label: "Major", className: "bg-warning/20 text-warning border-warning/50" },
    life: { label: "Life", className: "bg-destructive/20 text-destructive border-destructive/50" },
  };

  const config = severityConfig[severity];

  return (
    <Badge 
      variant="outline" 
      className={`${config.className} ${size === "sm" ? "text-xs px-1.5 py-0" : ""}`}
    >
      {config.label}
    </Badge>
  );
}

interface StatusBadgeProps {
  status: BoonStatus;
  size?: "sm" | "default";
}

export function StatusBadge({ status, size = "default" }: StatusBadgeProps) {
  const statusConfig = {
    outstanding: { label: "Outstanding", className: "bg-primary/20 text-primary border-primary/50" },
    fulfilled: { label: "Fulfilled", className: "bg-success/20 text-success border-success/50" },
    forgiven: { label: "Forgiven", className: "bg-mention-plot/20 text-mention-plot border-mention-plot/50" },
  };

  const config = statusConfig[status];

  return (
    <Badge 
      variant="outline" 
      className={`${config.className} ${size === "sm" ? "text-xs px-1.5 py-0" : ""}`}
    >
      {config.label}
    </Badge>
  );
}
