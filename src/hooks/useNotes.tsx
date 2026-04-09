import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useChronicles } from './useChronicles';

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
  const { currentChronicle } = useChronicles();
  const chronicleId = currentChronicle?.id;

  const { data: notes = [], isLoading: loading } = useQuery({
    queryKey: ['notes', chronicleId],
    queryFn: async () => {
      if (!chronicleId) return [];
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('chronicle_id', chronicleId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Note[] || [];
    },
    enabled: !!chronicleId,
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

  const updateNoteMutation = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; title?: string; content?: string | null; category?: string | null }) => {
      const { data, error } = await supabase
        .from('notes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      toast({ title: "Note updated" });
    },
    onError: (error: any) => {
      toast({ title: "Error updating note", description: error.message, variant: "destructive" });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('notes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      toast({ title: "Note deleted" });
    },
    onError: (error: any) => {
      toast({ title: "Error deleting note", description: error.message, variant: "destructive" });
    },
  });

  const updateNote = async (id: string, updates: { title?: string; content?: string | null; category?: string | null }) => {
    return updateNoteMutation.mutateAsync({ id, ...updates });
  };

  const deleteNote = async (id: string) => {
    return deleteNoteMutation.mutateAsync(id);
  };

  return {
    notes,
    loading,
    createNote,
    updateNote,
    deleteNote,
    refetch: () => queryClient.invalidateQueries({ queryKey: ['notes'] }),
  };
}
