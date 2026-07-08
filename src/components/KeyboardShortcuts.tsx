import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

/**
 * The active list page marks its primary "new" trigger with data-shortcut="new".
 * Pressing `N` outside inputs finds that element and clicks it.
 */
export const SHORTCUT_NEW_SELECTOR = '[data-shortcut="new"]';

const isEditableTarget = (el: EventTarget | null) => {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (el.isContentEditable) return true;
  return false;
};

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/.test(navigator.platform);
const modKey = isMac ? "⌘" : "Ctrl";

type Row = { keys: string[]; label: string };

const GLOBAL: Row[] = [
  { keys: [modKey, "K"], label: "Open global search" },
  { keys: ["?"], label: "Show this cheat sheet" },
  { keys: ["N"], label: "New item on the current list page" },
  { keys: ["Esc"], label: "Close dialog / menu" },
];

const NAVIGATION: { path: string; label: string }[] = [
  { path: "/", label: "Dashboard" },
  { path: "/characters", label: "Characters" },
  { path: "/stories", label: "Stories" },
  { path: "/sessions", label: "Sessions" },
  { path: "/locations", label: "Locations" },
  { path: "/relationships", label: "Relationships" },
  { path: "/timeline", label: "Timeline" },
  { path: "/settings", label: "Settings" },
];

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[1.75rem] h-7 px-2 rounded-md border border-border bg-muted text-xs font-medium text-foreground shadow-sm">
      {children}
    </kbd>
  );
}

export function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ignore when typing in inputs, or when other modifiers combine with the letter shortcuts
      if (isEditableTarget(e.target)) return;

      // `?` cheat sheet (Shift+/)
      if (e.key === "?" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }

      // `N` = new on current page
      if ((e.key === "n" || e.key === "N") && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent(SHORTCUT_NEW_EVENT));
        return;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Move faster through your chronicle. Shortcuts are disabled while typing in inputs.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Global</h3>
            <ul className="space-y-1.5">
              {GLOBAL.map((row) => (
                <li key={row.label} className="flex items-center justify-between gap-4 py-1">
                  <span className="text-sm">{row.label}</span>
                  <span className="flex items-center gap-1">
                    {row.keys.map((k, i) => (
                      <span key={i} className="flex items-center gap-1">
                        {i > 0 && <span className="text-xs text-muted-foreground">+</span>}
                        <Kbd>{k}</Kbd>
                      </span>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Jump to</h3>
            <div className="grid grid-cols-2 gap-1.5">
              {NAVIGATION.map((n) => {
                const active = location.pathname === n.path;
                return (
                  <button
                    key={n.path}
                    type="button"
                    onClick={() => {
                      navigate(n.path);
                      setOpen(false);
                    }}
                    className={`flex items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent ${
                      active ? "bg-accent/60 text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    <span>{n.label}</span>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
