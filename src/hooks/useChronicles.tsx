import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Chronicle {
  id: string;
  name: string;
  description: string | null;
  setting: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export function useChronicles() {
  const [chronicles, setChronicles] = useState<Chronicle[]>([]);
  const [currentChronicle, setCurrentChronicle] = useState<Chronicle | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchChronicles = async () => {
    try {
      const { data, error } = await supabase
        .from('chronicles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      const chronicleData = data as Chronicle[] || [];
      setChronicles(chronicleData);
      
      // Set current chronicle to the first one if none selected
      if (chronicleData.length > 0 && !currentChronicle) {
        setCurrentChronicle(chronicleData[0]);
      }
    } catch (error: any) {
      toast({
        title: "Error fetching chronicles",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createChronicle = async (chronicle: Omit<Chronicle, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('chronicles')
        .insert([{ ...chronicle, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      
      const newChronicle = data as Chronicle;
      setChronicles(prev => [newChronicle, ...prev]);
      
      // Set as current chronicle if it's the first one
      if (!currentChronicle) {
        setCurrentChronicle(newChronicle);
      }
      
      toast({
        title: "Chronicle created",
        description: `${chronicle.name} has been created.`,
      });
      
      return newChronicle;
    } catch (error: any) {
      toast({
        title: "Error creating chronicle",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const createDefaultChronicle = async () => {
    return createChronicle({
      name: "My Chronicle",
      description: "Default chronicle for your Vampire: The Masquerade game",
      setting: "Modern Nights"
    });
  };

  useEffect(() => {
    fetchChronicles();
  }, []);

  return {
    chronicles,
    currentChronicle,
    setCurrentChronicle,
    loading,
    createChronicle,
    createDefaultChronicle,
    refetch: fetchChronicles,
  };
}