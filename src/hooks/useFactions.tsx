import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

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
  const [factions, setFactions] = useState<Faction[]>([]);
  const [characterFactions, setCharacterFactions] = useState<CharacterFaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchFactions = async () => {
    try {
      let query = supabase
        .from('factions')
        .select('*')
        .order('name', { ascending: true });

      if (chronicleId) {
        query = query.eq('chronicle_id', chronicleId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setFactions(data as Faction[] || []);
    } catch (error: any) {
      toast({
        title: "Error fetching factions",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCharacterFactions = async () => {
    try {
      const { data, error } = await supabase
        .from('character_factions')
        .select('*');

      if (error) throw error;
      setCharacterFactions(data as CharacterFaction[] || []);
    } catch (error: any) {
      toast({
        title: "Error fetching character factions",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const createFaction = async (faction: Omit<Faction, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('factions')
        .insert([{ ...faction, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      
      setFactions(prev => [...prev, data as Faction]);
      toast({
        title: "Faction created",
        description: "New faction has been added.",
      });
      
      return data;
    } catch (error: any) {
      toast({
        title: "Error creating faction",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateFaction = async (id: string, updates: Partial<Faction>) => {
    try {
      const { data, error } = await supabase
        .from('factions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setFactions(prev => prev.map(faction => faction.id === id ? data as Faction : faction));
      toast({
        title: "Faction updated",
        description: "Faction has been successfully updated.",
      });
      
      return data;
    } catch (error: any) {
      toast({
        title: "Error updating faction",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteFaction = async (id: string) => {
    try {
      const { error } = await supabase
        .from('factions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setFactions(prev => prev.filter(faction => faction.id !== id));
      toast({
        title: "Faction deleted",
        description: "Faction has been successfully deleted.",
      });
    } catch (error: any) {
      toast({
        title: "Error deleting faction",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const addCharacterToFaction = async (characterId: string, factionId: string, role?: string) => {
    try {
      const { data, error } = await supabase
        .from('character_factions')
        .insert([{ character_id: characterId, faction_id: factionId, role }])
        .select()
        .single();

      if (error) throw error;
      
      setCharacterFactions(prev => [...prev, data as CharacterFaction]);
      toast({
        title: "Character added to faction",
        description: "Character has been added to the faction.",
      });
      
      return data;
    } catch (error: any) {
      toast({
        title: "Error adding character to faction",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const removeCharacterFromFaction = async (characterId: string, factionId: string) => {
    try {
      const { error } = await supabase
        .from('character_factions')
        .delete()
        .eq('character_id', characterId)
        .eq('faction_id', factionId);

      if (error) throw error;
      
      setCharacterFactions(prev => 
        prev.filter(cf => !(cf.character_id === characterId && cf.faction_id === factionId))
      );
      toast({
        title: "Character removed from faction",
        description: "Character has been removed from the faction.",
      });
    } catch (error: any) {
      toast({
        title: "Error removing character from faction",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchFactions();
    fetchCharacterFactions();
  }, [chronicleId]);

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
      fetchFactions();
      fetchCharacterFactions();
    },
  };
}
