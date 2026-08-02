import { useEntityCrud } from './useEntityCrud';

export interface Note {
  id: string;
  title: string;
  content: string | null;
  category: string | null;
  chronicle_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export function useNotes() {
  const { items: notes, loading, create, update, remove, refetch } = useEntityCrud<Note>({
    table: 'notes',
    queryKey: 'notes',
    label: 'Note',
    orderBy: { column: 'created_at', ascending: false },
  });

  const createNote = async (note: Omit<Note, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    return create(note);
  };

  const updateNote = async (id: string, updates: { title?: string; content?: string | null; category?: string | null }) => {
    return update(id, updates);
  };

  const deleteNote = async (id: string) => {
    return remove(id);
  };

  return {
    notes,
    loading,
    createNote,
    updateNote,
    deleteNote,
    refetch,
  };
}
