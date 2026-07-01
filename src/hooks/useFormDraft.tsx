import { useEffect, useRef, useCallback, useState } from 'react';

const DRAFT_PREFIX = 'form-draft:';
const DEBOUNCE_MS = 1500;

export type DraftStatus = 'idle' | 'saving' | 'saved';

/**
 * Auto-saves form data to localStorage with debounce.
 * Restores draft on mount if available.
 * Clears draft on successful submission.
 *
 * Also exposes a canonical `status` and `lastSavedAt` so consumers can render
 * a uniform "Draft saved" stamp via <DraftSavedIndicator />.
 */
export function useFormDraft<T>(
  key: string,
  formData: T,
  setFormData: (data: T) => void,
  options?: { enabled?: boolean }
) {
  const enabled = options?.enabled ?? true;
  const storageKey = `${DRAFT_PREFIX}${key}`;
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const initializedRef = useRef(false);
  const [status, setStatus] = useState<DraftStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  // Restore draft on mount (once)
  useEffect(() => {
    if (!enabled || initializedRef.current) return;
    initializedRef.current = true;

    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        setFormData(parsed);
        setLastSavedAt(new Date());
        setStatus('saved');
      }
    } catch {
      // Ignore parse errors
    }
  }, [storageKey, enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced save
  useEffect(() => {
    if (!enabled || !initializedRef.current) return;

    setStatus('saving');
    timerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(formData));
        setLastSavedAt(new Date());
        setStatus('saved');
      } catch {
        // Storage full or unavailable — leave status as-is
      }
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [formData, storageKey, enabled]);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(storageKey);
    setLastSavedAt(null);
    setStatus('idle');
  }, [storageKey]);

  const hasDraft = useCallback(() => {
    return localStorage.getItem(storageKey) !== null;
  }, [storageKey]);

  return { clearDraft, hasDraft, status, lastSavedAt };
}
