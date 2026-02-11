import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Note {
  id: string;
  title: string;
  content: string | null;
  category: string | null;
  chronicle_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export function useNotes() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: notes = [], isLoading: loading } = useQuery({
    queryKey: ['notes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Note[] || [];
    },
  });

  const createNoteMutation = useMutation({
    mutationFn: async (note: Omit<Note, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('notes')
        .insert([{ ...note, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      toast({
        title: "Note created",
        description: `${variables.title} has been added to your chronicle.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error creating note",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createNote = async (note: Omit<Note, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    return createNoteMutation.mutateAsync(note);
  };

  return {
    notes,
    loading,
    createNote,
    refetch: () => queryClient.invalidateQueries({ queryKey: ['notes'] }),
  };
}
