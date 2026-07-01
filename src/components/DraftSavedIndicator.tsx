import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import type { DraftStatus } from "@/hooks/useFormDraft";
import { cn } from "@/lib/utils";

interface DraftSavedIndicatorProps {
  status: DraftStatus;
  lastSavedAt: Date | null;
  className?: string;
}

function formatRelative(date: Date, now: number): string {
  const seconds = Math.max(0, Math.floor((now - date.getTime()) / 1000));
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleString();
}

/**
 * Uniform "Draft saved" stamp for autosaved forms.
 * Drives its label from useFormDraft's status + lastSavedAt.
 */
export function DraftSavedIndicator({ status, lastSavedAt, className }: DraftSavedIndicatorProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!lastSavedAt) return;
    const id = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(id);
  }, [lastSavedAt]);

  if (status === "idle" && !lastSavedAt) return null;

  const isSaving = status === "saving";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs text-muted-foreground",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      {isSaving ? (
        <>
          <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
          <span>Saving draft…</span>
        </>
      ) : (
        <>
          <Check className="h-3 w-3 text-success" aria-hidden />
          <span>
            Draft saved{lastSavedAt ? ` · ${formatRelative(lastSavedAt, now)}` : ""}
          </span>
        </>
      )}
    </span>
  );
}
