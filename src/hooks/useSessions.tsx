import { useQueryClient } from '@tanstack/react-query';
import { notify } from "@/lib/notify";
import { supabase } from '@/integrations/supabase/client';
import { useEntityCrud } from './useEntityCrud';

export interface Session {
  id: string;
  title: string;
  summary: string | null;
  date_played: string;
  experience_awarded: number | null;
  chronicle_id: string;
  plot_id: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
  attachments?: Array<{ id: string; name: string; url: string; type: string; size: number; uploaded_at: string }>;
  in_game_date_start?: string | null;
  in_game_date_end?: string | null;
  sort_order?: number;
}

export function useSessions() {
  const queryClient = useQueryClient();
  const {
    items: sessions,
    loading,
    create,
    update,
    remove,
    refetch,
  } = useEntityCrud<Session>({
    table: 'sessions',
    queryKey: 'sessions',
    label: 'Session',
    orderBy: [
      { column: 'sort_order', ascending: true },
      { column: 'date_played', ascending: false },
    ],
    transform: (row: Record<string, unknown>) => ({
      ...((row as unknown) as Session),
      attachments: ((row.attachments as unknown) as Session['attachments']) || [],
    }),
    extraInvalidate: [['session-characters']],
    preDelete: async (id) => {
      const { error } = await supabase
        .from('session_characters')
        .delete()
        .eq('session_id', id);
      if (error) throw error;
    },
    createMessage: (variables) => ({
      title: 'Session logged',
      description: `${variables.title} has been added to your chronicle.`,
    }),
    updateMessage: 'Session updated',
    deleteMessage: 'Session deleted',
  });

  const createSession = async (session: Omit<Session, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const result = await create(session);
    return result as Session;
  };

  const updateSession = async (id: string, updates: Partial<Omit<Session, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
    return update(id, updates);
  };

  const deleteSession = async (id: string) => {
    return remove(id);
  };

  const reorderSessions = async (orderedIds: string[]) => {
    try {
      const updates = orderedIds.map((id, index) =>
        supabase.from('sessions').update({ sort_order: index }).eq('id', id)
      );
      await Promise.all(updates);
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    } catch (error: any) {
      notify.error("Error reordering sessions", error.message);
    }
  };

  return {
    sessions,
    loading,
    createSession,
    updateSession,
    deleteSession,
    reorderSessions,
    refetch,
  };
}
