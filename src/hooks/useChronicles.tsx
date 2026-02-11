import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  const [currentChronicle, setCurrentChronicle] = useState<Chronicle | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: chronicles = [], isLoading: loading } = useQuery({
    queryKey: ['chronicles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chronicles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      const chronicleData = data as Chronicle[] || [];
      
      // Set current chronicle to the first one if none selected
      if (chronicleData.length > 0 && !currentChronicle) {
        setCurrentChronicle(chronicleData[0]);
      }
      
      return chronicleData;
    },
  });

  const createChronicleMutation = useMutation({
    mutationFn: async (chronicle: Omit<Chronicle, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('chronicles')
        .insert([{ ...chronicle, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data as Chronicle;
    },
    onSuccess: (newChronicle, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chronicles'] });
      
      if (!currentChronicle) {
        setCurrentChronicle(newChronicle);
      }
      
      toast({
        title: "Chronicle created",
        description: `${variables.name} has been created.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error creating chronicle",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createChronicle = async (chronicle: Omit<Chronicle, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    return createChronicleMutation.mutateAsync(chronicle);
  };

  const createDefaultChronicle = async () => {
    return createChronicle({
      name: "My Chronicle",
      description: "Default chronicle for your Vampire: The Masquerade game",
      setting: "Modern Nights"
    });
  };

  return {
    chronicles,
    currentChronicle,
    setCurrentChronicle,
    loading,
    createChronicle,
    createDefaultChronicle,
    refetch: () => queryClient.invalidateQueries({ queryKey: ['chronicles'] }),
  };
}
