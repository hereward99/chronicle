import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Plot {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  chronicle_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  attachments?: any[];
}

export function usePlots() {
  const [plots, setPlots] = useState<Plot[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPlots = async () => {
    try {
      const { data, error } = await supabase
        .from('plots')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPlots((data || []).map(plot => ({
        ...plot,
        attachments: plot.attachments || []
      })) as Plot[]);
    } catch (error: any) {
      toast({
        title: "Error fetching plots",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createPlot = async (plot: Omit<Plot, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('plots')
        .insert([{ ...plot, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      
      setPlots(prev => [data as Plot, ...prev]);
      toast({
        title: "Story created",
        description: `${plot.title} has been added to your chronicle.`,
      });
      
      return data;
    } catch (error: any) {
      toast({
        title: "Error creating story",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const updatePlot = async (id: string, updates: Partial<Plot>) => {
    try {
      const { data, error } = await supabase
        .from('plots')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setPlots(prev => prev.map(plot => plot.id === id ? data as Plot : plot));
      toast({
        title: "Story updated",
        description: "Your story has been updated successfully.",
      });
      
      return data;
    } catch (error: any) {
      toast({
        title: "Error updating story",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const deletePlot = async (id: string) => {
    try {
      const { error } = await supabase
        .from('plots')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setPlots(prev => prev.filter(plot => plot.id !== id));
      toast({
        title: "Story deleted",
        description: "The story has been removed from your chronicle.",
      });
    } catch (error: any) {
      toast({
        title: "Error deleting story",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchPlots();
  }, []);

  return { plots, loading, createPlot, updatePlot, deletePlot, refetch: fetchPlots };
}