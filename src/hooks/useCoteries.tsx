import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notify } from "@/lib/notify";
import { supabase } from '@/integrations/supabase/client';
import { useEntityCrud } from './useEntityCrud';

export interface Coterie {
  id: string;
  chronicle_id: string;
  user_id: string;
  name: string;
  description: string | null;
  domain: string | null;
  is_primary: boolean;
  coterie_type: string | null;
  city: string | null;
  chasse: number;
  portillon: number;
  lien: number;
  domain_merits: string | null;
  domain_resonance: string | null;
  haven_location: string | null;
  haven_merits_and_flaws: string | null;
  coterie_advantages_and_flaws: string | null;
  coterie_boons_and_debts: string | null;
  chronicle_tenets: string | null;
  coterie_goals: string | null;
  attachments: any[] | null;
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
  const queryClient = useQueryClient();

  const {
    items: coteries,
    loading,
    create,
    update,
    remove,
    refetch,
  } = useEntityCrud<Coterie>({
    table: 'coteries',
    queryKey: 'coteries',
    label: 'Coterie',
    chronicleId,
    allowUnscoped: true,
    orderBy: { column: 'created_at', ascending: false },
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

  const addMemberMutation = useMutation({
    mutationFn: async ({ coterieId, characterId, role }: { coterieId: string; characterId: string; role?: string }) => {
      const { error } = await supabase
        .from('coterie_members')
        .insert({ coterie_id: coterieId, character_id: characterId, role });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coterie_members'] });
      notify.success("Member added", "Character has been added to the coterie.");
    },
    onError: (error: Error) => {
      notify.error("Error adding member", error.message);
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
      queryClient.invalidateQueries({ queryKey: ['coterie_members'] });
      notify.success("Member removed", "Character has been removed from the coterie.");
    },
    onError: (error: Error) => {
      notify.error("Error removing member", error.message);
    },
  });

  const createCoterie = async (coterie: Omit<Coterie, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    return create(coterie);
  };

  const updateCoterie = async (id: string, updates: Partial<Coterie>) => {
    return update(id, updates);
  };

  const deleteCoterie = async (id: string) => {
    return remove(id);
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
    } catch (error) {
      notify.error("Error fetching members", (error as Error).message);
      return [];
    }
  };

  const setPrimaryCoterie = async (coterieId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      await supabase
        .from('coteries')
        .update({ is_primary: false })
        .eq('user_id', user.id);

      await supabase
        .from('coteries')
        .update({ is_primary: true })
        .eq('id', coterieId);

      queryClient.invalidateQueries({ queryKey: ['coteries'] });
      notify.success("Primary coterie set", "This coterie will appear at the centre of the relationship map.");
    } catch (error) {
      notify.error("Error setting primary coterie", (error as Error).message);
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
    setPrimaryCoterie,
    refetch,
  };
}
