import { useEntityCrud } from './useEntityCrud';
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
  const { user } = useAuth();
  const {
    items: locations,
    loading,
    error,
    create,
    update,
    remove,
    refetch,
    chronicleId,
  } = useEntityCrud<Location>({
    table: 'locations',
    queryKey: 'locations',
    label: 'Location',
    orderBy: { column: 'name', ascending: true },
    injectUserId: false,
  });

  const createLocation = async (location: Omit<Location, 'id' | 'created_at' | 'updated_at'>) => {
    return create(location);
  };

  const updateLocation = async (updates: Partial<Location> & { id: string }) => {
    const { id, ...rest } = updates;
    return update(id, rest);
  };

  const deleteLocation = async (id: string) => {
    return remove(id);
  };

  return {
    locations,
    isLoading: loading,
    error,
    createLocation,
    updateLocation,
    deleteLocation,
    refetch,
    chronicleId,
    userId: user?.id,
  };
}
