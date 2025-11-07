import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

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
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchRelationships = async () => {
    try {
      let query = supabase
        .from('relationships')
        .select('*')
        .order('created_at', { ascending: false });

      if (characterId) {
        query = query.or(`character_id.eq.${characterId},related_character_id.eq.${characterId}`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setRelationships(data as Relationship[] || []);
    } catch (error: any) {
      toast({
        title: "Error fetching relationships",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createRelationship = async (relationship: Omit<Relationship, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('relationships')
        .insert([{ ...relationship, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      
      setRelationships(prev => [data as Relationship, ...prev]);
      toast({
        title: "Relationship created",
        description: "The relationship has been added.",
      });
      
      return data;
    } catch (error: any) {
      toast({
        title: "Error creating relationship",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateRelationship = async (id: string, updates: Partial<Relationship>) => {
    try {
      const { data, error } = await supabase
        .from('relationships')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setRelationships(prev => prev.map(rel => rel.id === id ? data as Relationship : rel));
      toast({
        title: "Relationship updated",
        description: "The relationship has been updated.",
      });
      
      return data;
    } catch (error: any) {
      toast({
        title: "Error updating relationship",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteRelationship = async (id: string) => {
    try {
      const { error } = await supabase
        .from('relationships')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setRelationships(prev => prev.filter(rel => rel.id !== id));
      toast({
        title: "Relationship deleted",
        description: "The relationship has been deleted.",
      });
    } catch (error: any) {
      toast({
        title: "Error deleting relationship",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchRelationships();
  }, [characterId]);

  return {
    relationships,
    loading,
    createRelationship,
    updateRelationship,
    deleteRelationship,
    refetch: fetchRelationships,
  };
}
