import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

// Dice Pool types for Storyteller Characters
export interface SimpleDicePool {
  type: 'simple';
  difficulty: number; // Difficulty to beat / rolls 2x this for pool
}

export interface GeneralDicePool {
  type: 'general';
  primary: number;   // Pool for areas of expertise
  secondary: number; // Pool for mediocre/poor areas
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
  attachments?: any[];
  
  // Dice Pools (for Storyteller Characters)
  use_dice_pools?: boolean;
  skip_attributes?: boolean;
  dice_pools?: DicePoolConfig | null;
  
  // Physical Attributes
  strength?: number;
  dexterity?: number;
  stamina?: number;
  
  // Social Attributes
  charisma?: number;
  manipulation?: number;
  composure?: number;
  
  // Mental Attributes
  intelligence?: number;
  wits?: number;
  resolve?: number;
  
  // Skills & Disciplines
  skills?: Record<string, { rating: number; specialty?: string }>;
  disciplines?: Array<{ name: string; level: number }>;
  powers?: Array<{ name: string; discipline: string; level: number; cost?: string; description?: string }>;
  
  // Character Creation
  predator_type?: string;
  chronicle_tenets?: string[];
  
  // Advantages & Flaws
  advantages?: Array<{ name: string; type: string; rating?: number; description?: string }>;
  flaws?: Array<{ name: string; rating?: number; description?: string }>;
  loresheets?: Array<{ name: string; benefits: string[] }>;
  
  // Beliefs
  convictions?: string[];
  touchstones?: Array<{ name: string; conviction?: string; description?: string }>;
  ambition?: string;
  desire?: string;
  
  // Trackers
  health_max?: number;
  health_superficial?: number;
  health_aggravated?: number;
  willpower_max?: number;
  willpower_superficial?: number;
  willpower_aggravated?: number;
  humanity?: number;
  hunger?: number;
  blood_potency?: number;
  
  // Experience
  experience_total?: number;
  experience_spent?: number;
  
  // Additional Details
  appearance?: string;
  distinguishing_features?: string;
  history?: string;
  notes?: string;
  resonance?: string;
}

const fetchCharacters = async (): Promise<Character[]> => {
  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as unknown as Character[] || []).map(char => ({
    ...char,
    attachments: char.attachments || []
  }));
};

export function useCharacters() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: characters = [], isLoading: loading } = useQuery({
    queryKey: ['characters'],
    queryFn: fetchCharacters,
  });

  const createMutation = useMutation({
    mutationFn: async (character: Omit<Character, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('characters')
        .insert([{ ...character, user_id: user.id } as any])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['characters'] });
      toast({
        title: "Character created",
        description: `${variables.name} has been added to your chronicle.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error creating character",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Character> }) => {
      const { data, error } = await supabase
        .from('characters')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['characters'] });
      toast({
        title: "Character updated",
        description: "Character has been successfully updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating character",
        description: error.message,
        variant: "destructive",
      });
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
      toast({
        title: "Character deleted",
        description: "Character has been successfully deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting character",
        description: error.message,
        variant: "destructive",
      });
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