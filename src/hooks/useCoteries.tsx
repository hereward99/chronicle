import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface Coterie {
  id: string;
  chronicle_id: string;
  user_id: string;
  name: string;
  description: string | null;
  domain: string | null;
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
  const [coteries, setCoteries] = useState<Coterie[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCoteries = async () => {
    try {
      let query = supabase
        .from('coteries')
        .select('*')
        .order('created_at', { ascending: false });

      if (chronicleId) {
        query = query.eq('chronicle_id', chronicleId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setCoteries(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching coteries",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createCoterie = async (coterie: Omit<Coterie, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('coteries')
        .insert([{ ...coterie, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      
      setCoteries(prev => [data as Coterie, ...prev]);
      toast({
        title: "Coterie created",
        description: `${coterie.name} has been created.`,
      });
      
      return data;
    } catch (error: any) {
      toast({
        title: "Error creating coterie",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateCoterie = async (id: string, updates: Partial<Coterie>) => {
    try {
      const { data, error } = await supabase
        .from('coteries')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setCoteries(prev => prev.map(c => c.id === id ? data as Coterie : c));
      toast({
        title: "Coterie updated",
        description: "Coterie has been successfully updated.",
      });
      
      return data;
    } catch (error: any) {
      toast({
        title: "Error updating coterie",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteCoterie = async (id: string) => {
    try {
      const { error } = await supabase
        .from('coteries')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setCoteries(prev => prev.filter(c => c.id !== id));
      toast({
        title: "Coterie deleted",
        description: "Coterie has been successfully deleted.",
      });
    } catch (error: any) {
      toast({
        title: "Error deleting coterie",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const addMember = async (coterieId: string, characterId: string, role?: string) => {
    try {
      const { error } = await supabase
        .from('coterie_members')
        .insert({ coterie_id: coterieId, character_id: characterId, role });

      if (error) throw error;

      toast({
        title: "Member added",
        description: "Character has been added to the coterie.",
      });
    } catch (error: any) {
      toast({
        title: "Error adding member",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const removeMember = async (coterieId: string, characterId: string) => {
    try {
      const { error } = await supabase
        .from('coterie_members')
        .delete()
        .eq('coterie_id', coterieId)
        .eq('character_id', characterId);

      if (error) throw error;

      toast({
        title: "Member removed",
        description: "Character has been removed from the coterie.",
      });
    } catch (error: any) {
      toast({
        title: "Error removing member",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const getCoterieMembers = async (coterieId: string): Promise<string[]> => {
    try {
      const { data, error } = await supabase
        .from('coterie_members')
        .select('character_id')
        .eq('coterie_id', coterieId);

      if (error) throw error;
      return data.map(m => m.character_id);
    } catch (error: any) {
      toast({
        title: "Error fetching members",
        description: error.message,
        variant: "destructive",
      });
      return [];
    }
  };

  useEffect(() => {
    fetchCoteries();
  }, [chronicleId]);

  return {
    coteries,
    loading,
    createCoterie,
    updateCoterie,
    deleteCoterie,
    addMember,
    removeMember,
    getCoterieMembers,
    refetch: fetchCoteries,
  };
}
