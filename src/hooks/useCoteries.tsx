import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface Coterie {
  id: string;
  chronicle_id: string;
  user_id: string;
  name: string;
  description: string | null;
  domain: string | null;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface CoterieMember {
  id: string;
  coterie_id: string;
  character_id: string;
  role: string | null;
  created_at: string;
}

export function useCoteries(chronicleId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: coteries = [], isLoading: loading } = useQuery({
    queryKey: ['coteries', chronicleId],
    queryFn: async () => {
      let query = supabase
        .from('coteries')
        .select('*')
        .order('created_at', { ascending: false });

      if (chronicleId) {
        query = query.eq('chronicle_id', chronicleId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Coterie[] || [];
    },
  });

  const { data: allCoterieMembers = [] } = useQuery({
    queryKey: ['coterie_members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coterie_members')
        .select('*');
      if (error) throw error;
      return data as CoterieMember[] || [];
    },
  });

  const createCoterieMutation = useMutation({
    mutationFn: async (coterie: Omit<Coterie, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('coteries')
        .insert([{ ...coterie, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['coteries'] });
      toast({ title: "Coterie created", description: `${variables.name} has been created.` });
    },
    onError: (error: any) => {
      toast({ title: "Error creating coterie", description: error.message, variant: "destructive" });
    },
  });

  const updateCoterieMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Coterie> }) => {
      const { data, error } = await supabase
        .from('coteries')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coteries'] });
      toast({ title: "Coterie updated", description: "Coterie has been successfully updated." });
    },
    onError: (error: any) => {
      toast({ title: "Error updating coterie", description: error.message, variant: "destructive" });
    },
  });

  const deleteCoterieMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('coteries')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coteries'] });
      toast({ title: "Coterie deleted", description: "Coterie has been successfully deleted." });
    },
    onError: (error: any) => {
      toast({ title: "Error deleting coterie", description: error.message, variant: "destructive" });
    },
  });

  const addMemberMutation = useMutation({
    mutationFn: async ({ coterieId, characterId, role }: { coterieId: string; characterId: string; role?: string }) => {
      const { error } = await supabase
        .from('coterie_members')
        .insert({ coterie_id: coterieId, character_id: characterId, role });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Member added", description: "Character has been added to the coterie." });
    },
    onError: (error: any) => {
      toast({ title: "Error adding member", description: error.message, variant: "destructive" });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async ({ coterieId, characterId }: { coterieId: string; characterId: string }) => {
      const { error } = await supabase
        .from('coterie_members')
        .delete()
        .eq('coterie_id', coterieId)
        .eq('character_id', characterId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Member removed", description: "Character has been removed from the coterie." });
    },
    onError: (error: any) => {
      toast({ title: "Error removing member", description: error.message, variant: "destructive" });
    },
  });

  const createCoterie = async (coterie: Omit<Coterie, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    return createCoterieMutation.mutateAsync(coterie);
  };

  const updateCoterie = async (id: string, updates: Partial<Coterie>) => {
    return updateCoterieMutation.mutateAsync({ id, updates });
  };

  const deleteCoterie = async (id: string) => {
    return deleteCoterieMutation.mutateAsync(id);
  };

  const addMember = async (coterieId: string, characterId: string, role?: string) => {
    return addMemberMutation.mutateAsync({ coterieId, characterId, role });
  };

  const removeMember = async (coterieId: string, characterId: string) => {
    return removeMemberMutation.mutateAsync({ coterieId, characterId });
  };

  const getCoterieMembers = async (coterieId: string): Promise<string[]> => {
    try {
      const { data, error } = await supabase
        .from('coterie_members')
        .select('character_id')
        .eq('coterie_id', coterieId);

      if (error) throw error;
      return data.map(m => m.character_id);
    } catch (error: any) {
      toast({ title: "Error fetching members", description: error.message, variant: "destructive" });
      return [];
    }
  };

  const setPrimaryCoterie = async (coterieId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Clear all primary flags for this user's coteries
      await supabase
        .from('coteries')
        .update({ is_primary: false })
        .eq('user_id', user.id);

      // Set the selected one as primary
      await supabase
        .from('coteries')
        .update({ is_primary: true })
        .eq('id', coterieId);

      queryClient.invalidateQueries({ queryKey: ['coteries'] });
      toast({ title: "Primary coterie set", description: "This coterie will appear at the centre of the relationship map." });
    } catch (error: any) {
      toast({ title: "Error setting primary coterie", description: error.message, variant: "destructive" });
    }
  };

  return {
    coteries,
    loading,
    allCoterieMembers,
    createCoterie,
    updateCoterie,
    deleteCoterie,
    addMember,
    removeMember,
    getCoterieMembers,
    refetch: () => queryClient.invalidateQueries({ queryKey: ['coteries'] }),
  };
}
