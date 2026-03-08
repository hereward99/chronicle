import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface InGameDateInputProps {
  startValue: string;
  endValue: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  className?: string;
}

/**
 * Flexible in-game date input supporting year-only, month+year, or full dates.
 * Stored as free text (e.g. "1939", "January 1939", "15 March 1939").
 */
export function InGameDateInput({ startValue, endValue, onStartChange, onEndChange, className }: InGameDateInputProps) {
  return (
    <div className={className}>
      <Label className="text-sm">In-Game Date</Label>
      <p className="text-xs text-muted-foreground mb-2">
        When was this set? E.g. "1939", "January 1939", "15 March 1939"
      </p>
      <div className="grid grid-cols-2 gap-2">
        <Input
          value={startValue}
          onChange={(e) => onStartChange(e.target.value)}
          placeholder="Start (e.g. January 1939)"
          className="bg-input border-border text-sm"
        />
        <Input
          value={endValue}
          onChange={(e) => onEndChange(e.target.value)}
          placeholder="End (optional)"
          className="bg-input border-border text-sm"
        />
      </div>
    </div>
  );
}

/** Format in-game date range for display */
export function formatInGameDate(start?: string | null, end?: string | null): string | null {
  if (!start && !end) return null;
  if (start && end) return `${start} – ${end}`;
  return start || end || null;
}
