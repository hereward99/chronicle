import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useChronicles } from './useChronicles';

export interface ChronicleStats {
  characters: { total: number; pcs: number; npcs: number };
  sessions: { total: number; lastSession: string | null };
  plots: { total: number; active: number };
  notes: { total: number };
}

const defaultStats: ChronicleStats = {
  characters: { total: 0, pcs: 0, npcs: 0 },
  sessions: { total: 0, lastSession: null },
  plots: { total: 0, active: 0 },
  notes: { total: 0 },
};

export function useChronicleStats() {
  const { currentChronicle } = useChronicles();
  const chronicleId = currentChronicle?.id;

  const { data: stats = defaultStats, isLoading: loading, refetch } = useQuery({
    queryKey: ['chronicleStats', chronicleId],
    queryFn: async () => {
      const [charactersRes, sessionsRes, plotsRes, notesRes] = await Promise.all([
        supabase.from('characters').select('type').eq('chronicle_id', chronicleId!),
        supabase.from('sessions').select('date_played').eq('chronicle_id', chronicleId!).order('date_played', { ascending: false }),
        supabase.from('plots').select('status').eq('chronicle_id', chronicleId!),
        supabase.from('notes').select('id').eq('chronicle_id', chronicleId!),
      ]);

      if (charactersRes.error) throw charactersRes.error;
      if (sessionsRes.error) throw sessionsRes.error;
      if (plotsRes.error) throw plotsRes.error;
      if (notesRes.error) throw notesRes.error;

      const characters = charactersRes.data || [];
      const sessions = sessionsRes.data || [];
      const plots = plotsRes.data || [];
      const notes = notesRes.data || [];

      return {
        characters: {
          total: characters.length,
          pcs: characters.filter(c => c.type === 'PC').length,
          npcs: characters.filter(c => c.type === 'NPC').length,
        },
        sessions: {
          total: sessions.length,
          lastSession: sessions[0]?.date_played || null,
        },
        plots: {
          total: plots.length,
          active: plots.filter(p => p.status === 'Active' || p.status === 'Critical').length,
        },
        notes: { total: notes.length },
      };
    },
    enabled: !!chronicleId,
  });

  return { stats, loading, refetch };
}
