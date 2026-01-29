import { Badge } from "@/components/ui/badge";
import { BoonSeverity, BoonStatus } from "@/hooks/useBoons";

interface BoonBadgeProps {
  severity: BoonSeverity;
  size?: "sm" | "default";
}

export function BoonBadge({ severity, size = "default" }: BoonBadgeProps) {
  const severityConfig = {
    trivial: { label: "Trivial", className: "bg-slate-500/20 text-slate-300 border-slate-500/50" },
    minor: { label: "Minor", className: "bg-blue-500/20 text-blue-300 border-blue-500/50" },
    major: { label: "Major", className: "bg-amber-500/20 text-amber-300 border-amber-500/50" },
    life: { label: "Life", className: "bg-red-500/20 text-red-300 border-red-500/50" },
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
    fulfilled: { label: "Fulfilled", className: "bg-green-500/20 text-green-300 border-green-500/50" },
    forgiven: { label: "Forgiven", className: "bg-purple-500/20 text-purple-300 border-purple-500/50" },
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
