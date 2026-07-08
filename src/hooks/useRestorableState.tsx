import { useState, useEffect, useRef } from "react";

/**
 * Like useState but persists to sessionStorage so navigating away and back
 * (e.g. list → detail → back) restores the value within the same tab session.
 */
export function useRestorableState<T>(key: string, initial: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const storageKey = `restore:${key}`;
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (raw !== null) return JSON.parse(raw) as T;
    } catch {}
    return initial;
  });

  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(value));
    } catch {}
  }, [storageKey, value]);

  return [value, setValue];
}

/**
 * Restores window scroll position for the current route when the component
 * remounts. Save on scroll (throttled via rAF) and on unmount.
 */
export function useScrollRestore(key: string) {
  const storageKey = `scroll:${key}`;

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        try {
          sessionStorage.setItem(storageKey, String(window.scrollY));
        } catch {}
      });
    };

    // Restore after paint so list items have rendered.
    const restore = () => {
      try {
        const raw = sessionStorage.getItem(storageKey);
        if (raw !== null) {
          const y = Number(raw);
          if (!Number.isNaN(y)) window.scrollTo(0, y);
        }
      } catch {}
    };
    const t = window.setTimeout(restore, 50);

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
      try {
        sessionStorage.setItem(storageKey, String(window.scrollY));
      } catch {}
    };
  }, [storageKey]);
}
