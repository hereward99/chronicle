import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: factions = [], isLoading: loading } = useQuery({
    queryKey: ['factions', chronicleId],
    queryFn: async () => {
      let query = supabase
        .from('factions')
        .select('*')
        .order('name', { ascending: true });

      if (chronicleId) {
        query = query.eq('chronicle_id', chronicleId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Faction[] || [];
    },
  });

  const { data: characterFactions = [] } = useQuery({
    queryKey: ['characterFactions', chronicleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('character_factions')
        .select('*');

      if (error) throw error;
      return data as CharacterFaction[] || [];
    },
  });

  const createFactionMutation = useMutation({
    mutationFn: async (faction: Omit<Faction, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('factions')
        .insert([{ ...faction, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['factions'] });
      toast({ title: "Faction created", description: "New faction has been added." });
    },
    onError: (error: any) => {
      toast({ title: "Error creating faction", description: error.message, variant: "destructive" });
    },
  });

  const updateFactionMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Faction> }) => {
      const { data, error } = await supabase
        .from('factions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['factions'] });
      toast({ title: "Faction updated", description: "Faction has been successfully updated." });
    },
    onError: (error: any) => {
      toast({ title: "Error updating faction", description: error.message, variant: "destructive" });
    },
  });

  const deleteFactionMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('factions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['factions'] });
      toast({ title: "Faction deleted", description: "Faction has been successfully deleted." });
    },
    onError: (error: any) => {
      toast({ title: "Error deleting faction", description: error.message, variant: "destructive" });
    },
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
      toast({ title: "Character added to faction", description: "Character has been added to the faction." });
    },
    onError: (error: any) => {
      toast({ title: "Error adding character to faction", description: error.message, variant: "destructive" });
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
      toast({ title: "Character removed from faction", description: "Character has been removed from the faction." });
    },
    onError: (error: any) => {
      toast({ title: "Error removing character from faction", description: error.message, variant: "destructive" });
    },
  });

  const createFaction = async (faction: Omit<Faction, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    return createFactionMutation.mutateAsync(faction);
  };

  const updateFaction = async (id: string, updates: Partial<Faction>) => {
    return updateFactionMutation.mutateAsync({ id, updates });
  };

  const deleteFaction = async (id: string) => {
    return deleteFactionMutation.mutateAsync(id);
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
