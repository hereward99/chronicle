import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notify } from "@/lib/notify";
import { supabase } from '@/integrations/supabase/client';
import { useChronicles } from './useChronicles';
import { useAuth } from './useAuth';
export interface Location {
  id: string;
  chronicle_id: string;
  user_id: string;
  name: string;
  description: string | null;
  notes: string | null;
  coordinates: string | null;
  country: string | null;
  city_region: string | null;
  attachments: any[] | null;
  created_at: string;
  updated_at: string;
}

export function useLocations() {
  const queryClient = useQueryClient();
  const { currentChronicle } = useChronicles();
  const { user } = useAuth();
  const { data: locations = [], isLoading, error } = useQuery({
    queryKey: ['locations', currentChronicle?.id],
    queryFn: async () => {
      if (!currentChronicle?.id) return [];
      
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('chronicle_id', currentChronicle.id)
        .order('name');
      
      if (error) throw error;
      return data as Location[];
    },
    enabled: !!currentChronicle?.id,
  });

  const createLocationMutation = useMutation({
    mutationFn: async (location: Omit<Location, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('locations')
        .insert(location)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      notify.success('Location created');
    },
    onError: (error) => {
      notify.error('Failed to create location', error.message);
    },
  });

  const updateLocationMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Location> & { id: string }) => {
      const { data, error } = await supabase
        .from('locations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      notify.success('Location updated');
    },
    onError: (error) => {
      notify.error('Failed to update location', error.message);
    },
  });

  const deleteLocationMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('locations')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      notify.success('Location deleted');
    },
    onError: (error) => {
      notify.error('Failed to delete location', error.message);
    },
  });

  const createLocation = async (location: Omit<Location, 'id' | 'created_at' | 'updated_at'>) => {
    return createLocationMutation.mutateAsync(location);
  };

  const updateLocation = async (updates: Partial<Location> & { id: string }) => {
    return updateLocationMutation.mutateAsync(updates);
  };

  const deleteLocation = async (id: string) => {
    return deleteLocationMutation.mutateAsync(id);
  };

  return {
    locations,
    isLoading,
    error,
    createLocation,
    updateLocation,
    deleteLocation,
    chronicleId: currentChronicle?.id,
    userId: user?.id,
  };
}
