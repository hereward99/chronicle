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
          .or(`title.ilike.${q},description.ilike.${q},summary.ilike.${q}`)
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

      // Collect matching character IDs to find linked plots/sessions
      const matchedCharIds = (characters.data || []).map((c: any) => c.id);

      let linkedPlots: any[] = [];
      let linkedSessions: any[] = [];

      if (matchedCharIds.length > 0) {
        const [plotLinks, sessionLinks] = await Promise.all([
          supabase
            .from('plot_characters')
            .select('plot_id')
            .in('character_id', matchedCharIds),
          supabase
            .from('session_characters')
            .select('session_id')
            .in('character_id', matchedCharIds),
        ]);

        const existingPlotIds = new Set((plots.data || []).map((p: any) => p.id));
        const existingSessionIds = new Set((sessions.data || []).map((s: any) => s.id));

        const linkedPlotIds = [...new Set((plotLinks.data || []).map((r: any) => r.plot_id))]
          .filter(id => !existingPlotIds.has(id));
        const linkedSessionIds = [...new Set((sessionLinks.data || []).map((r: any) => r.session_id))]
          .filter(id => !existingSessionIds.has(id));

        const [extraPlots, extraSessions] = await Promise.all([
          linkedPlotIds.length > 0
            ? supabase.from('plots').select('id, title, status').in('id', linkedPlotIds).limit(8)
            : Promise.resolve({ data: [] }),
          linkedSessionIds.length > 0
            ? supabase.from('sessions').select('id, title, date_played').in('id', linkedSessionIds).limit(8)
            : Promise.resolve({ data: [] }),
        ]);

        linkedPlots = extraPlots.data || [];
        linkedSessions = extraSessions.data || [];
      }

      // Build a character name lookup for subtitles
      const charNameMap = new Map((characters.data || []).map((c: any) => [c.id, c.name]));
      const getLinkedCharNames = (entityId: string, links: any[], idField: string) => {
        const charIds = links.filter((l: any) => l[idField] === entityId).map((l: any) => l.character_id);
        return charIds.map((cid: string) => charNameMap.get(cid)).filter(Boolean).join(', ');
      };

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
        ...linkedPlots.map((p: any) => ({
          id: p.id,
          type: 'plot' as const,
          title: p.title,
          subtitle: `${p.status} · linked character`,
          route: '/stories',
        })),
        ...(sessions.data || []).map((s: any) => ({
          id: s.id,
          type: 'session' as const,
          title: s.title,
          subtitle: s.date_played,
          route: '/sessions',
        })),
        ...linkedSessions.map((s: any) => ({
          id: s.id,
          type: 'session' as const,
          title: s.title,
          subtitle: `${s.date_played} · linked character`,
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
