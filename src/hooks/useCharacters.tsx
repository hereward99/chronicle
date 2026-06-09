import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useChronicles } from './useChronicles';
import type { TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

// Dice Pool types for Storyteller Characters
export interface SimpleDicePool {
  type: 'simple';
  difficulty: number;
}

export interface GeneralDicePool {
  type: 'general';
  primary: number;
  secondary: number;
}

export interface ExceptionalPool {
  name: string;
  pool: number;
}

export interface StandardDicePool {
  type: 'standard';
  physical: number;
  social: number;
  mental: number;
  exceptional: ExceptionalPool[];
}

export interface CombinedDicePool {
  type: 'combined';
  general: { primary: number; secondary: number };
  standard: { physical: number; social: number; mental: number; exceptional: ExceptionalPool[] };
}

export type DicePoolConfig = SimpleDicePool | GeneralDicePool | StandardDicePool | CombinedDicePool;

export interface Character {
  id: string;
  name: string;
  clan: string;
  generation: number | null;
  type: 'PC' | 'NPC';
  status: string;
  concept: string | null;
  sire: string | null;
  coterie: string | null;
  avatar_url: string | null;
  chronicle_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  attachments?: Array<{ id: string; name: string; url: string; type: string; size: number; uploaded_at: string }>;
  
  use_dice_pools?: boolean;
  skip_attributes?: boolean;
  dice_pools?: DicePoolConfig | null;
  
  strength?: number;
  dexterity?: number;
  stamina?: number;
  charisma?: number;
  manipulation?: number;
  composure?: number;
  intelligence?: number;
  wits?: number;
  resolve?: number;
  
  skills?: Record<string, { rating: number; specialty?: string }>;
  disciplines?: Array<{ name: string; level: number }>;
  powers?: Array<{ name: string; discipline: string; level: number; cost?: string; description?: string }>;
  
  predator_type?: string;
  chronicle_tenets?: string[];
  
  advantages?: Array<{ name: string; type: string; rating?: number; description?: string }>;
  flaws?: Array<{ name: string; rating?: number; description?: string }>;
  loresheets?: Array<{ name: string; benefits: string[] }>;
  
  convictions?: string[];
  touchstones?: Array<{ name: string; conviction?: string; description?: string }>;
  ambition?: string;
  desire?: string;
  
  health_max?: number;
  health_superficial?: number;
  health_aggravated?: number;
  willpower_max?: number;
  willpower_superficial?: number;
  willpower_aggravated?: number;
  humanity?: number;
  hunger?: number;
  blood_potency?: number;
  
  experience_total?: number;
  experience_spent?: number;
  
  appearance?: string;
  distinguishing_features?: string;
  history?: string;
  notes?: string;
  resonance?: string;
}

export function useCharacters() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentChronicle } = useChronicles();
  const chronicleId = currentChronicle?.id;

  const { data: characters = [], isLoading: loading } = useQuery({
    queryKey: ['characters', chronicleId],
    queryFn: async () => {
      if (!chronicleId) return [];
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('chronicle_id', chronicleId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return ((data ?? []) as unknown as Character[]).map(char => ({
        ...char,
        attachments: char.attachments || []
      }));
    },
    enabled: !!chronicleId,
  });

  const createMutation = useMutation({
    mutationFn: async (character: Omit<Character, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('characters')
        .insert([{ ...character, user_id: user.id } as unknown as TablesInsert<'characters'>])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['characters'] });
      notify.success("Character created", `${variables.name} has been added to your chronicle.`);
    },
    onError: (error: Error) => {
      notify.error("Error creating character", error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Character> }) => {
      const { data, error } = await supabase
        .from('characters')
        .update(updates as unknown as TablesUpdate<'characters'>)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['characters'] });
      notify.success("Character updated", "Character has been successfully updated.");
    },
    onError: (error: Error) => {
      notify.error("Error updating character", error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('characters')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['characters'] });
      notify.success("Character deleted", "Character has been successfully deleted.");
    },
    onError: (error: Error) => {
      notify.error("Error deleting character", error.message);
    },
  });

  const createCharacter = async (character: Omit<Character, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    return createMutation.mutateAsync(character);
  };

  const updateCharacter = async (id: string, updates: Partial<Character>) => {
    return updateMutation.mutateAsync({ id, updates });
  };

  const deleteCharacter = async (id: string) => {
    return deleteMutation.mutateAsync(id);
  };

  return {
    characters,
    loading,
    createCharacter,
    updateCharacter,
    deleteCharacter,
    refetch: () => queryClient.invalidateQueries({ queryKey: ['characters'] }),
  };
}
