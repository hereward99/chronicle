import { toast } from "sonner";

interface UndoableActionOptions {
  /** Message shown in the toast while the action is pending undo. */
  description: string;
  /** Async work to perform if the user does NOT click undo. */
  perform: () => Promise<void> | void;
  /** Optional cleanup/restore work if you want to do anything when undone. */
  onUndo?: () => void;
  /** Milliseconds before the action is committed. Default 5000. */
  duration?: number;
  /** Label for the undo button. */
  undoLabel?: string;
  /** Toast shown after the action commits. */
  successMessage?: string;
  /** Toast shown if the perform() throws. */
  errorMessage?: string;
}

/**
 * Show a sonner toast with an Undo button. The destructive `perform` callback
 * is deferred for `duration` ms; if the user clicks Undo, it never runs.
 *
 * Use for reversible, non-cascading destructive actions (delete note, remove
 * a member). Keep AlertDialog for irreversible cascades (delete chronicle).
 */
export function undoableAction({
  description,
  perform,
  onUndo,
  duration = 5000,
  undoLabel = "Undo",
  successMessage,
  errorMessage = "Action failed",
}: UndoableActionOptions) {
  let undone = false;

  const timer = setTimeout(async () => {
    if (undone) return;
    try {
      await perform();
      if (successMessage) toast.success(successMessage);
    } catch (err) {
      console.error(err);
      toast.error(errorMessage);
    }
  }, duration);

  toast(description, {
    duration,
    action: {
      label: undoLabel,
      onClick: () => {
        undone = true;
        clearTimeout(timer);
        onUndo?.();
      },
    },
  });
}
