import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useChronicles } from '@/hooks/useChronicles';

export interface SearchResult {
  id: string;
  type: 'character' | 'plot' | 'session' | 'location' | 'note' | 'faction' | 'coterie' | 'boon';
  title: string;
  subtitle?: string;
  route: string;
}

const TYPE_ROUTES: Record<SearchResult['type'], string> = {
  character: '/characters',
  plot: '/stories',
  session: '/sessions',
  location: '/locations',
  note: '/',
  faction: '/characters',
  coterie: '/coteries',
  boon: '/relationships',
};

export function useGlobalSearch() {
  const { currentChronicle } = useChronicles();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (query: string) => {
    if (!query.trim() || !currentChronicle) {
      setResults([]);
      return;
    }

    setLoading(true);
    const q = `%${query.trim()}%`;
    const chronicleId = currentChronicle.id;

    try {
      const [characters, plots, sessions, locations, notes, factions, coteries] = await Promise.all([
        supabase
          .from('characters')
          .select('id, name, clan, type')
          .eq('chronicle_id', chronicleId)
          .or(`name.ilike.${q},clan.ilike.${q},concept.ilike.${q}`)
          .limit(8),
        supabase
          .from('plots')
          .select('id, title, status')
          .eq('chronicle_id', chronicleId)
          .or(`title.ilike.${q},description.ilike.${q}`)
          .limit(8),
        supabase
          .from('sessions')
          .select('id, title, date_played')
          .eq('chronicle_id', chronicleId)
          .or(`title.ilike.${q},summary.ilike.${q}`)
          .limit(8),
        supabase
          .from('locations')
          .select('id, name, description')
          .eq('chronicle_id', chronicleId)
          .or(`name.ilike.${q},description.ilike.${q}`)
          .limit(8),
        supabase
          .from('notes')
          .select('id, title, category')
          .eq('chronicle_id', chronicleId)
          .or(`title.ilike.${q},content.ilike.${q}`)
          .limit(8),
        supabase
          .from('factions')
          .select('id, name, description')
          .eq('chronicle_id', chronicleId)
          .or(`name.ilike.${q},description.ilike.${q}`)
          .limit(5),
        supabase
          .from('coteries')
          .select('id, name, description')
          .eq('chronicle_id', chronicleId)
          .or(`name.ilike.${q},description.ilike.${q}`)
          .limit(5),
      ]);

      const mapped: SearchResult[] = [
        ...(characters.data || []).map((c: any) => ({
          id: c.id,
          type: 'character' as const,
          title: c.name,
          subtitle: `${c.type} · ${c.clan}`,
          route: '/characters',
        })),
        ...(plots.data || []).map((p: any) => ({
          id: p.id,
          type: 'plot' as const,
          title: p.title,
          subtitle: p.status,
          route: '/stories',
        })),
        ...(sessions.data || []).map((s: any) => ({
          id: s.id,
          type: 'session' as const,
          title: s.title,
          subtitle: s.date_played,
          route: '/sessions',
        })),
        ...(locations.data || []).map((l: any) => ({
          id: l.id,
          type: 'location' as const,
          title: l.name,
          subtitle: l.description?.slice(0, 60),
          route: '/locations',
        })),
        ...(notes.data || []).map((n: any) => ({
          id: n.id,
          type: 'note' as const,
          title: n.title,
          subtitle: n.category,
          route: '/',
        })),
        ...(factions.data || []).map((f: any) => ({
          id: f.id,
          type: 'faction' as const,
          title: f.name,
          subtitle: 'Faction',
          route: '/characters',
        })),
        ...(coteries.data || []).map((c: any) => ({
          id: c.id,
          type: 'coterie' as const,
          title: c.name,
          subtitle: 'Coterie',
          route: '/coteries',
        })),
      ];

      setResults(mapped);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [currentChronicle]);

  return { results, loading, search };
}
