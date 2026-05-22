/**
 * Single source of truth for entity status badge styling.
 * Returned classes are intended to be passed to <Badge className={...}>.
 *
 * Uses semantic tokens (bg-primary, bg-muted, bg-destructive, …) wherever the
 * meaning maps cleanly. For statuses where we need distinct hues that don't
 * exist as semantic roles (Ally / Rival / Planned / Unknown / Critical),
 * we use HSL-token-based Tailwind utilities defined alongside the existing
 * --relationship-* tokens in index.css.
 */

export type EntityStatusKind = "character" | "plot" | "session";

const NEUTRAL = "bg-muted text-muted-foreground hover:bg-muted/80 border-transparent";

// Shared per-state class table. Keys are lower-cased for tolerant matching.
const SHARED: Record<string, string> = {
  // Positive / present
  active: "bg-emerald-700 text-white hover:bg-emerald-800 border-transparent",
  // Friendly / supportive
  ally: "bg-sky-800 text-sky-50 hover:bg-sky-700 border-transparent",
  friend: "bg-sky-800 text-sky-50 hover:bg-sky-700 border-transparent",
  // Hostile / urgent
  enemy: "bg-destructive text-destructive-foreground hover:bg-destructive/90 border-transparent",
  critical: "bg-destructive text-destructive-foreground hover:bg-destructive/90 border-transparent",
  rival: "bg-amber-700 text-amber-50 hover:bg-amber-800 border-transparent",
  // Planning / future
  planned: "bg-indigo-800 text-indigo-50 hover:bg-indigo-700 border-transparent",
  // Unknown
  unknown: "bg-purple-800 text-purple-50 hover:bg-purple-700 border-transparent",
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
