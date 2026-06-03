import { format, parseISO, isValid } from "date-fns";
import { Calendar, Hourglass } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatInGameDate } from "@/components/InGameDateInput";

/**
 * Unified date display for the chronicle. Renders either a real-world
 * (ISO) date or a narrative in-game date range, with consistent
 * formatting, optional prefix, and optional icon.
 *
 * Use exactly ONE of:
 *   - `value`     : ISO string or Date (real-world timestamp)
 *   - `inGameStart` / `inGameEnd` : narrative free-text date range
 *
 * If the relevant value(s) are empty, the component renders nothing.
 */
export type ChronicleDateVariant = "long" | "short" | "compact";

interface ChronicleDateProps {
  /** Real-world date (ISO string or Date). */
  value?: string | Date | null;
  /** Narrative in-game start (free text like "January 1939"). */
  inGameStart?: string | null;
  /** Narrative in-game end (free text). */
  inGameEnd?: string | null;
  /** Display format for the real-world date. */
  variant?: ChronicleDateVariant;
  /** Optional label, e.g. "Set in", "Created", "Played". */
  prefix?: string;
  /** Show a small leading icon. */
  withIcon?: boolean;
  /** Render as an inline `<span>` (default) or a block. */
  as?: "span" | "div";
  className?: string;
}

function formatRealDate(value: string | Date, variant: ChronicleDateVariant): string | null {
  const date = typeof value === "string" ? parseISO(value) : value;
  if (!isValid(date)) return null;
  switch (variant) {
    case "long":
      return format(date, "MMMM d, yyyy");
    case "compact":
      return format(date, "d MMM yyyy");
    case "short":
    default:
      return format(date, "MMM d, yyyy");
  }
}

export function ChronicleDate({
  value,
  inGameStart,
  inGameEnd,
  variant = "short",
  prefix,
  withIcon = false,
  as = "span",
  className,
}: ChronicleDateProps) {
  const isInGame = value == null;
  const text = isInGame
    ? formatInGameDate(inGameStart, inGameEnd)
    : formatRealDate(value as string | Date, variant);

  if (!text) return null;

  const Icon = isInGame ? Hourglass : Calendar;
  const Tag = as;

  return (
    <Tag
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap",
        isInGame && "text-primary/80",
        className,
      )}
    >
      {withIcon && <Icon className="h-3.5 w-3.5 shrink-0" />}
      {prefix && <span className="text-muted-foreground">{prefix}:</span>}
      <span>{text}</span>
    </Tag>
  );
}
