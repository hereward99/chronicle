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
  plot_id: string | null;
  chronicle_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  attachments?: any[];
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