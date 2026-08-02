import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notify } from "@/lib/notify";
import { supabase } from '@/integrations/supabase/client';
import { useEntityCrud } from './useEntityCrud';

export interface Faction {
  id: string;
  chronicle_id: string;
  user_id: string;
  name: string;
  description: string | null;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface CharacterFaction {
  id: string;
  character_id: string;
  faction_id: string;
  role: string | null;
  created_at: string;
}

export function useFactions(chronicleId?: string) {
  const queryClient = useQueryClient();

  const {
    items: factions,
    loading,
    create,
    update,
    remove,
    refetch,
  } = useEntityCrud<Faction>({
    table: 'factions',
    queryKey: 'factions',
    label: 'Faction',
    chronicleId,
    orderBy: { column: 'name', ascending: true },
  });

  const factionIds = factions.map(f => f.id);

  const { data: characterFactions = [] } = useQuery({
    queryKey: ['characterFactions', chronicleId],
    queryFn: async () => {
      if (factionIds.length === 0) return [];
      const { data, error } = await supabase
        .from('character_factions')
        .select('*')
        .in('faction_id', factionIds);

      if (error) throw error;
      return data as CharacterFaction[] || [];
    },
    enabled: !!chronicleId && factionIds.length > 0,
  });

  const addCharacterToFactionMutation = useMutation({
    mutationFn: async ({ characterId, factionId, role }: { characterId: string; factionId: string; role?: string }) => {
      const { data, error } = await supabase
        .from('character_factions')
        .insert([{ character_id: characterId, faction_id: factionId, role }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['characterFactions'] });
      notify.success("Character added to faction", "Character has been added to the faction.");
    },
    onError: (error: any) => {
      notify.error("Error adding character to faction", error.message);
    },
  });

  const removeCharacterFromFactionMutation = useMutation({
    mutationFn: async ({ characterId, factionId }: { characterId: string; factionId: string }) => {
      const { error } = await supabase
        .from('character_factions')
        .delete()
        .eq('character_id', characterId)
        .eq('faction_id', factionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['characterFactions'] });
      notify.success("Character removed from faction", "Character has been removed from the faction.");
    },
    onError: (error: any) => {
      notify.error("Error removing character from faction", error.message);
    },
  });

  const createFaction = async (faction: Omit<Faction, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    return create(faction);
  };

  const updateFaction = async (id: string, updates: Partial<Faction>) => {
    return update(id, updates);
  };

  const deleteFaction = async (id: string) => {
    return remove(id);
  };

  const addCharacterToFaction = async (characterId: string, factionId: string, role?: string) => {
    return addCharacterToFactionMutation.mutateAsync({ characterId, factionId, role });
  };

  const removeCharacterFromFaction = async (characterId: string, factionId: string) => {
    return removeCharacterFromFactionMutation.mutateAsync({ characterId, factionId });
  };

  return {
    factions,
    characterFactions,
    loading,
    createFaction,
    updateFaction,
    deleteFaction,
    addCharacterToFaction,
    removeCharacterFromFaction,
    refetch: () => {
      queryClient.invalidateQueries({ queryKey: ['factions'] });
      queryClient.invalidateQueries({ queryKey: ['characterFactions'] });
    },
  };
}
