import { useEffect, useRef, useCallback } from 'react';

const DRAFT_PREFIX = 'form-draft:';
const DEBOUNCE_MS = 1500;

/**
 * Auto-saves form data to localStorage with debounce.
 * Restores draft on mount if available.
 * Clears draft on successful submission.
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

  // Restore draft on mount (once)
  useEffect(() => {
    if (!enabled || initializedRef.current) return;
    initializedRef.current = true;

    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        setFormData(parsed);
      }
    } catch {
      // Ignore parse errors
    }
  }, [storageKey, enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced save
  useEffect(() => {
    if (!enabled || !initializedRef.current) return;

    timerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(formData));
      } catch {
        // Storage full or unavailable
      }
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [formData, storageKey, enabled]);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(storageKey);
  }, [storageKey]);

  const hasDraft = useCallback(() => {
    return localStorage.getItem(storageKey) !== null;
  }, [storageKey]);

  return { clearDraft, hasDraft };
}
