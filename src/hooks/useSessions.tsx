import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
}

export function useSessions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: sessions = [], isLoading: loading } = useQuery({
    queryKey: ['sessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .order('date_played', { ascending: false });

      if (error) throw error;
      return (data as Session[] || []).map(session => ({
        ...session,
        attachments: session.attachments || []
      }));
    },
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

  const createSession = async (session: Omit<Session, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const result = await createSessionMutation.mutateAsync(session);
    return result as Session;
  };

  const updateSession = async (id: string, updates: Partial<Omit<Session, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
    return updateSessionMutation.mutateAsync({ id, updates });
  };

  return {
    sessions,
    loading,
    createSession,
    updateSession,
    refetch: () => queryClient.invalidateQueries({ queryKey: ['sessions'] }),
  };
}
