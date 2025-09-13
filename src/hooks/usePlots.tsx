import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

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
        .in('status', ['Active', 'Critical'])
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) throw error;
      setPlots(data || []);
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

  useEffect(() => {
    fetchPlots();
  }, []);

  return { plots, loading, refetch: fetchPlots };
}