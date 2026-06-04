/**
 * Single source of truth for entity status badge styling.
 * Returned classes are intended to be passed to <Badge className={...}>.
 *
 * Uses semantic tokens defined in index.css / tailwind.config.ts so that
 * every status colour participates in the warm gothic theme rather than
 * pulling raw Tailwind palette swatches.
 */

export type EntityStatusKind = "character" | "plot" | "session";

const NEUTRAL = "bg-muted text-muted-foreground hover:bg-muted/80 border-transparent";

// Shared per-state class table. Keys are lower-cased for tolerant matching.
const SHARED: Record<string, string> = {
  // Positive / present
  active: "bg-success text-success-foreground hover:bg-success/90 border-transparent",
  // Friendly / supportive
  ally: "bg-info text-info-foreground hover:bg-info/90 border-transparent",
  friend: "bg-info text-info-foreground hover:bg-info/90 border-transparent",
  // Hostile / urgent
  enemy: "bg-destructive text-destructive-foreground hover:bg-destructive/90 border-transparent",
  critical: "bg-destructive text-destructive-foreground hover:bg-destructive/90 border-transparent",
  rival: "bg-warning text-warning-foreground hover:bg-warning/90 border-transparent",
  // Planning / future
  planned: "bg-info text-info-foreground hover:bg-info/90 border-transparent",
  // Unknown
  unknown: "bg-accent text-accent-foreground hover:bg-accent/90 border-transparent",
  // Closed / inactive
  completed: NEUTRAL,
  inactive: NEUTRAL,
  dead: NEUTRAL,
  missing: NEUTRAL,
  cancelled: NEUTRAL,
  archived: NEUTRAL,
};

export function statusBadgeClass(
  _kind: EntityStatusKind,
  status: string | null | undefined,
): string {
  if (!status) return NEUTRAL;
  return SHARED[status.toLowerCase()] ?? NEUTRAL;
}
