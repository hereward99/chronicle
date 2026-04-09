import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Boon {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  chronicle_id: string;
  creditor_id: string;
  debtor_id: string;
  severity: 'trivial' | 'minor' | 'major' | 'life';
  description: string;
  notes: string | null;
  plot_id: string | null;
  session_id: string | null;
  status: 'outstanding' | 'fulfilled' | 'forgiven';
}

export type BoonSeverity = 'trivial' | 'minor' | 'major' | 'life';
export type BoonStatus = 'outstanding' | 'fulfilled' | 'forgiven';

export function useBoons(chronicleId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: boons = [], isLoading: loading } = useQuery({
    queryKey: ['boons', chronicleId],
    queryFn: async () => {
      if (!chronicleId) return [];

      const { data, error } = await supabase
        .from('boons')
        .select('*')
        .eq('chronicle_id', chronicleId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as unknown as Boon[]) || [];
    },
    enabled: !!chronicleId,
  });

  const createBoonMutation = useMutation({
    mutationFn: async (boon: Omit<Boon, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('boons')
        .insert([{ ...boon, user_id: user.id } as any])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boons'] });
      toast({ title: "Boon created", description: "The boon has been recorded." });
    },
    onError: (error: any) => {
      toast({ title: "Error creating boon", description: error.message, variant: "destructive" });
    },
  });

  const updateBoonMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Boon> }) => {
      const { data, error } = await supabase
        .from('boons')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boons'] });
      toast({ title: "Boon updated", description: "The boon has been updated." });
    },
    onError: (error: any) => {
      toast({ title: "Error updating boon", description: error.message, variant: "destructive" });
    },
  });

  const deleteBoonMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('boons')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boons'] });
      toast({ title: "Boon deleted", description: "The boon has been removed." });
    },
    onError: (error: any) => {
      toast({ title: "Error deleting boon", description: error.message, variant: "destructive" });
    },
  });

  const createBoon = async (boon: Omit<Boon, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    return createBoonMutation.mutateAsync(boon);
  };

  const updateBoon = async (id: string, updates: Partial<Boon>) => {
    return updateBoonMutation.mutateAsync({ id, updates });
  };

  const deleteBoon = async (id: string) => {
    return deleteBoonMutation.mutateAsync(id);
  };

  const getBoonsHeld = (characterId: string) => {
    return boons.filter(b => b.creditor_id === characterId);
  };

  const getDebtsOwed = (characterId: string) => {
    return boons.filter(b => b.debtor_id === characterId);
  };

  const getBoonsForCharacter = (characterId: string) => {
    return boons.filter(b => b.creditor_id === characterId || b.debtor_id === characterId);
  };

  return {
    boons,
    loading,
    createBoon,
    updateBoon,
    deleteBoon,
    getBoonsHeld,
    getDebtsOwed,
    getBoonsForCharacter,
    refetch: () => queryClient.invalidateQueries({ queryKey: ['boons'] }),
  };
}
