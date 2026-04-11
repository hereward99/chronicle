import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useChronicles } from './useChronicles';

export interface Activity {
  id: string;
  type: 'character' | 'session' | 'plot' | 'note';
  action: string;
  timestamp: string;
}

export function useRecentActivity() {
  const { currentChronicle } = useChronicles();
  const chronicleId = currentChronicle?.id;

  const { data: activities = [], isLoading: loading, refetch } = useQuery({
    queryKey: ['recentActivity', chronicleId],
    queryFn: async () => {
      const [
        { data: characters, error: charError },
        { data: sessions, error: sessError },
        { data: plots, error: plotError },
        { data: notes, error: noteError },
      ] = await Promise.all([
        supabase.from('characters').select('id, name, created_at, updated_at').eq('chronicle_id', chronicleId!).order('created_at', { ascending: false }).limit(10),
        supabase.from('sessions').select('id, title, created_at, updated_at').eq('chronicle_id', chronicleId!).order('created_at', { ascending: false }).limit(10),
        supabase.from('plots').select('id, title, created_at, updated_at').eq('chronicle_id', chronicleId!).order('created_at', { ascending: false }).limit(10),
        supabase.from('notes').select('id, title, created_at, updated_at').eq('chronicle_id', chronicleId!).order('created_at', { ascending: false }).limit(10),
      ]);

      if (charError) throw charError;
      if (sessError) throw sessError;
      if (plotError) throw plotError;
      if (noteError) throw noteError;

      const allActivities: Activity[] = [
        ...(characters || []).map(char => ({
          id: char.id,
          type: 'character' as const,
          action: `Created character: ${char.name}`,
          timestamp: char.created_at,
        })),
        ...(sessions || []).map(session => ({
          id: session.id,
          type: 'session' as const,
          action: `Logged session: ${session.title}`,
          timestamp: session.created_at,
        })),
        ...(plots || []).map(plot => ({
          id: plot.id,
          type: 'plot' as const,
          action: `Created plot: ${plot.title}`,
          timestamp: plot.created_at,
        })),
        ...(notes || []).map(note => ({
          id: note.id,
          type: 'note' as const,
          action: `Added note: ${note.title}`,
          timestamp: note.created_at,
        })),
      ];

      return allActivities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 5);
    },
    enabled: !!chronicleId,
  });

  return { activities, loading, refetch };
}
