import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useChronicles } from './useChronicles';

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
  attachments?: any[];
  in_game_date_start?: string | null;
  in_game_date_end?: string | null;
  sort_order?: number;
}

export function useSessions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentChronicle } = useChronicles();
  const chronicleId = currentChronicle?.id;

  const { data: sessions = [], isLoading: loading } = useQuery({
    queryKey: ['sessions', chronicleId],
    queryFn: async () => {
      if (!chronicleId) return [];
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('chronicle_id', chronicleId)
        .order('sort_order', { ascending: true })
        .order('date_played', { ascending: false });

      if (error) throw error;
      return (data as Session[] || []).map(session => ({
        ...session,
        attachments: session.attachments || []
      }));
    },
    enabled: !!chronicleId,
  });

  const createSessionMutation = useMutation({
    mutationFn: async (session: Omit<Session, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('sessions')
        .insert([{ ...session, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      toast({
        title: "Session logged",
        description: `${variables.title} has been added to your chronicle.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error creating session",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateSessionMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Omit<Session, 'id' | 'user_id' | 'created_at' | 'updated_at'>> }) => {
      const { data, error } = await supabase
        .from('sessions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      toast({
        title: "Session updated",
        description: "Your session has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating session",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteSessionMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error: scError } = await supabase
        .from('session_characters')
        .delete()
        .eq('session_id', id);
      if (scError) throw scError;

      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['session-characters'] });
      toast({
        title: "Session deleted",
        description: "Session has been successfully deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting session",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createSession = async (session: Omit<Session, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const result = await createSessionMutation.mutateAsync(session);
    return result as Session;
  };

  const updateSession = async (id: string, updates: Partial<Omit<Session, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
    return updateSessionMutation.mutateAsync({ id, updates });
  };

  const deleteSession = async (id: string) => {
    return deleteSessionMutation.mutateAsync(id);
  };

  const reorderSessions = async (orderedIds: string[]) => {
    try {
      const updates = orderedIds.map((id, index) =>
        supabase.from('sessions').update({ sort_order: index }).eq('id', id)
      );
      await Promise.all(updates);
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    } catch (error: any) {
      toast({
        title: "Error reordering sessions",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return {
    sessions,
    loading,
    createSession,
    updateSession,
    deleteSession,
    reorderSessions,
    refetch: () => queryClient.invalidateQueries({ queryKey: ['sessions'] }),
  };
}
