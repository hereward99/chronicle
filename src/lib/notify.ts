/**
 * Canonical toast taxonomy. Use these four shapes everywhere — do not call
 * `toast(...)` or `sonner` directly in feature code.
 *
 *   notify.success(title, description?)  — confirms a completed action
 *   notify.error(title, description?)    — surfaces a failure the user can react to
 *   notify.offline(actionName)           — connection required for `actionName`
 *   notify.undo({...})                   — reversible destructive action with Undo button
 *
 * Success/error/offline use the legacy `useToast` queue (top-right viewport).
 * Undo uses sonner so it can render an action button.
 */
import { toast as legacyToast } from "@/hooks/use-toast";
import { undoableAction } from "@/lib/undoableAction";

type UndoOpts = Parameters<typeof undoableAction>[0];

export const notify = {
  success(title: string, description?: string) {
    legacyToast({ title, description });
  },

  error(title: string, description?: string) {
    legacyToast({ title, description, variant: "destructive" });
  },

  offline(actionName: string) {
    legacyToast({
      title: "You're offline",
      description: `"${actionName}" requires an internet connection.`,
      variant: "destructive",
    });
  },

  undo(opts: UndoOpts) {
    undoableAction(opts);
  },
};
