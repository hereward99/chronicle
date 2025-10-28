import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

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

export function useCharacters() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCharacters = async () => {
    try {
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCharacters((data as Character[] || []).map(char => ({
        ...char,
        attachments: char.attachments || []
      })));
    } catch (error: any) {
      toast({
        title: "Error fetching characters",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createCharacter = async (character: Omit<Character, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('characters')
        .insert([{ ...character, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      
      setCharacters(prev => [data as Character, ...prev]);
      toast({
        title: "Character created",
        description: `${character.name} has been added to your chronicle.`,
      });
      
      return data;
    } catch (error: any) {
      toast({
        title: "Error creating character",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateCharacter = async (id: string, updates: Partial<Character>) => {
    try {
      const { data, error } = await supabase
        .from('characters')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setCharacters(prev => prev.map(char => char.id === id ? data as Character : char));
      toast({
        title: "Character updated",
        description: "Character has been successfully updated.",
      });
      
      return data;
    } catch (error: any) {
      toast({
        title: "Error updating character",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteCharacter = async (id: string) => {
    try {
      const { error } = await supabase
        .from('characters')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setCharacters(prev => prev.filter(char => char.id !== id));
      toast({
        title: "Character deleted",
        description: "Character has been successfully deleted.",
      });
    } catch (error: any) {
      toast({
        title: "Error deleting character",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchCharacters();
  }, []);

  return {
    characters,
    loading,
    createCharacter,
    updateCharacter,
    deleteCharacter,
    refetch: fetchCharacters,
  };
}