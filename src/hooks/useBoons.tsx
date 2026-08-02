import { useEntityCrud } from './useEntityCrud';

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
  const { items: boons, loading, create, update, remove, refetch } = useEntityCrud<Boon>({
    table: 'boons',
    queryKey: 'boons',
    label: 'Boon',
    chronicleId,
    orderBy: { column: 'created_at', ascending: false },
    createMessage: 'Boon created',
    updateMessage: 'Boon updated',
    deleteMessage: 'Boon deleted',
  });

  const createBoon = async (boon: Omit<Boon, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    return create(boon);
  };

  const updateBoon = async (id: string, updates: Partial<Boon>) => {
    return update(id, updates);
  };

  const deleteBoon = async (id: string) => {
    return remove(id);
  };

  const getBoonsHeld = (characterId: string) => {
    return boons.filter(b => b.creditor_id === characterId);
  };

  const getDebtsOwed = (characterId: string) => {
    return boons.filter(b => b.debtor_id === characterId);
  };

  const getBoonsForCharacter = (characterId: string) => {
    return boons.filter(b => b.creditor_id === characterId || b.debtor_id === characterId);
  };

  return {
    boons,
    loading,
    createBoon,
    updateBoon,
    deleteBoon,
    getBoonsHeld,
    getDebtsOwed,
    getBoonsForCharacter,
    refetch,
  };
}
