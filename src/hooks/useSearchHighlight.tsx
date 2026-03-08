import { useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

export function useSearchHighlight() {
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightId = searchParams.get('highlight');
  const searchQuery = searchParams.get('q') || '';
  const cleared = useRef(false);

  // Scroll to highlighted element and clear params after animation
  useEffect(() => {
    if (!highlightId || cleared.current) return;

    const tryScroll = () => {
      const el = document.querySelector(`[data-entity-id="${highlightId}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('search-highlight-pulse');
        const timeout = setTimeout(() => {
          el.classList.remove('search-highlight-pulse');
          cleared.current = true;
          setSearchParams({}, { replace: true });
        }, 3000);
        return () => clearTimeout(timeout);
      }
    };

    // Delay to let cards render
    const timer = setTimeout(tryScroll, 300);
    return () => clearTimeout(timer);
  }, [highlightId, setSearchParams]);

  const isHighlighted = useCallback(
    (id: string) => id === highlightId,
    [highlightId]
  );

  return { highlightId, searchQuery, isHighlighted };
}
