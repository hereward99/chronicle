import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface Boon {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  chronicle_id: string;
  creditor_id: string;
  debtor_id: string;
  severity: 'trivial' | 'minor' | 'major' | 'life';
  description: string;
  notes: string | null;
  plot_id: string | null;
  session_id: string | null;
  status: 'outstanding' | 'fulfilled' | 'forgiven';
}

export type BoonSeverity = 'trivial' | 'minor' | 'major' | 'life';
export type BoonStatus = 'outstanding' | 'fulfilled' | 'forgiven';

export function useBoons(chronicleId?: string) {
  const [boons, setBoons] = useState<Boon[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchBoons = async () => {
    if (!chronicleId) {
      setBoons([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('boons')
        .select('*')
        .eq('chronicle_id', chronicleId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBoons((data as unknown as Boon[]) || []);
    } catch (error: any) {
      toast({
        title: "Error fetching boons",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createBoon = async (boon: Omit<Boon, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('boons')
        .insert([{ ...boon, user_id: user.id } as any])
        .select()
        .single();

      if (error) throw error;
      
      setBoons(prev => [data as unknown as Boon, ...prev]);
      toast({
        title: "Boon created",
        description: "The boon has been recorded.",
      });
      
      return data;
    } catch (error: any) {
      toast({
        title: "Error creating boon",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateBoon = async (id: string, updates: Partial<Boon>) => {
    try {
      const { data, error } = await supabase
        .from('boons')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setBoons(prev => prev.map(b => b.id === id ? data as unknown as Boon : b));
      toast({
        title: "Boon updated",
        description: "The boon has been updated.",
      });
      
      return data;
    } catch (error: any) {
      toast({
        title: "Error updating boon",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteBoon = async (id: string) => {
    try {
      const { error } = await supabase
        .from('boons')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setBoons(prev => prev.filter(b => b.id !== id));
      toast({
        title: "Boon deleted",
        description: "The boon has been removed.",
      });
    } catch (error: any) {
      toast({
        title: "Error deleting boon",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  // Get boons where a character is the creditor (boons held)
  const getBoonsHeld = (characterId: string) => {
    return boons.filter(b => b.creditor_id === characterId);
  };

  // Get boons where a character is the debtor (debts owed)
  const getDebtsOwed = (characterId: string) => {
    return boons.filter(b => b.debtor_id === characterId);
  };

  // Get all boons involving a character (either as creditor or debtor)
  const getBoonsForCharacter = (characterId: string) => {
    return boons.filter(b => b.creditor_id === characterId || b.debtor_id === characterId);
  };

  useEffect(() => {
    fetchBoons();
  }, [chronicleId]);

  return {
    boons,
    loading,
    createBoon,
    updateBoon,
    deleteBoon,
    getBoonsHeld,
    getDebtsOwed,
    getBoonsForCharacter,
    refetch: fetchBoons,
  };
}
