import { useEffect } from 'react';
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
      return (data as Chronicle[]) || [];
    },
  });

  // Store currentChronicle selection in a separate query cache entry
  const { data: selectedChronicle } = useQuery<Chronicle | null>({
    queryKey: ['currentChronicle'],
    queryFn: () => null,
    enabled: false,
    staleTime: Infinity,
    initialData: null,
  });

  // Auto-select first chronicle when chronicles load and none is selected
  const currentChronicle = selectedChronicle ?? (chronicles.length > 0 ? chronicles[0] : null);

  useEffect(() => {
    if (!selectedChronicle && chronicles.length > 0) {
      queryClient.setQueryData<Chronicle | null>(['currentChronicle'], chronicles[0]);
    }
  }, [selectedChronicle, chronicles, queryClient]);

  const setCurrentChronicle = (chronicle: Chronicle | null) => {
    queryClient.setQueryData<Chronicle | null>(['currentChronicle'], chronicle);
  };

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

      // Auto-select if none selected
      const current = queryClient.getQueryData<Chronicle | null>(['currentChronicle']);
      if (!current) {
        queryClient.setQueryData<Chronicle | null>(['currentChronicle'], newChronicle);
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
