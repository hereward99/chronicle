import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useChronicles } from './useChronicles';
import { useCharacters } from './useCharacters';

export interface Relationship {
  id: string;
  character_id: string;
  related_character_id: string;
  user_id: string;
  relationship_type: string;
  intensity: number;
  description: string | null;
  is_mutual: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useRelationships(characterId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { characters } = useCharacters();

  // Derive chronicle character IDs to scope relationships
  const characterIds = characters.map(c => c.id);
  const characterIdsKey = characterIds.slice().sort().join(',');

  const { data: relationships = [], isLoading: loading } = useQuery({
    queryKey: ['relationships', characterId, characterIdsKey],
    queryFn: async () => {
      let query = supabase
        .from('relationships')
        .select('*')
        .order('created_at', { ascending: false });

      if (characterId) {
        query = query.or(`character_id.eq.${characterId},related_character_id.eq.${characterId}`);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Filter to only relationships involving characters in the current chronicle
      const allRels = data as Relationship[] || [];
      if (characterIds.length > 0 && !characterId) {
        return allRels.filter(r => characterIds.includes(r.character_id) || characterIds.includes(r.related_character_id));
      }
      return allRels;
    },
    enabled: characterIds.length > 0 || !!characterId,
  });

  const createRelationshipMutation = useMutation({
    mutationFn: async (relationship: Omit<Relationship, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('relationships')
        .insert([{ ...relationship, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relationships'] });
      notify.success("Relationship created", "New relationship has been added.");
    },
    onError: (error: any) => {
      notify.error("Error creating relationship", error.message);
    },
  });

  const updateRelationshipMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Relationship> }) => {
      const { data, error } = await supabase
        .from('relationships')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relationships'] });
      notify.success("Relationship updated", "Relationship has been successfully updated.");
    },
    onError: (error: any) => {
      notify.error("Error updating relationship", error.message);
    },
  });

  const deleteRelationshipMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('relationships')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relationships'] });
      notify.success("Relationship deleted", "Relationship has been successfully deleted.");
    },
    onError: (error: any) => {
      notify.error("Error deleting relationship", error.message);
    },
  });

  const createRelationship = async (relationship: Omit<Relationship, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    return createRelationshipMutation.mutateAsync(relationship);
  };

  const updateRelationship = async (id: string, updates: Partial<Relationship>) => {
    return updateRelationshipMutation.mutateAsync({ id, updates });
  };

  const deleteRelationship = async (id: string) => {
    return deleteRelationshipMutation.mutateAsync(id);
  };

  return {
    relationships,
    loading,
    createRelationship,
    updateRelationship,
    deleteRelationship,
    refetch: () => queryClient.invalidateQueries({ queryKey: ['relationships'] }),
  };
}
