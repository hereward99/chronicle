import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useChronicles } from './useChronicles';

export interface Plot {
  id: string;
  title: string;
  summary: string | null;
  description: string | null;
  status: string;
  priority: string;
  chronicle_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  attachments?: Array<{ id: string; name: string; url: string; type?: string; size?: number }>;
  in_game_date_start?: string | null;
  in_game_date_end?: string | null;
}

export function usePlots() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentChronicle } = useChronicles();
  const chronicleId = currentChronicle?.id;

  const { data: plots = [], isLoading: loading } = useQuery({
    queryKey: ['plots', chronicleId],
    queryFn: async () => {
      if (!chronicleId) return [];
      const { data, error } = await supabase
        .from('plots')
        .select('*')
        .eq('chronicle_id', chronicleId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(plot => ({
        ...plot,
        attachments: plot.attachments || []
      })) as Plot[];
    },
    enabled: !!chronicleId,
  });

  const createPlotMutation = useMutation({
    mutationFn: async (plot: Omit<Plot, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('plots')
        .insert([{ ...plot, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['plots'] });
      toast({
        title: "Story created",
        description: `${variables.title} has been added to your chronicle.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error creating story",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updatePlotMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Plot> }) => {
      const { data, error } = await supabase
        .from('plots')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plots'] });
      toast({
        title: "Story updated",
        description: "Your story has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating story",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deletePlotMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('plots')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plots'] });
      toast({
        title: "Story deleted",
        description: "The story has been removed from your chronicle.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting story",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createPlot = async (plot: Omit<Plot, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    return createPlotMutation.mutateAsync(plot);
  };

  const updatePlot = async (id: string, updates: Partial<Plot>) => {
    return updatePlotMutation.mutateAsync({ id, updates });
  };

  const deletePlot = async (id: string) => {
    return deletePlotMutation.mutateAsync(id);
  };

  return { plots, loading, createPlot, updatePlot, deletePlot, refetch: () => queryClient.invalidateQueries({ queryKey: ['plots'] }) };
}
