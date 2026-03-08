import { useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface DevNote {
  id: string;
  text: string;
  category: 'fix' | 'feature' | 'change' | 'idea';
  done: boolean;
  created_at: string;
}

const LOCAL_KEY = 'chronicle-keeper-dev-notes';
const MIGRATED_KEY = 'chronicle-keeper-dev-notes-migrated';

export function useDevNotes() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const migrated = useRef(false);

  const { data: devNotes = [], isLoading } = useQuery({
    queryKey: ['dev_notes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dev_notes' as any)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as any[]).map((n: any) => ({
        id: n.id,
        text: n.text,
        category: n.category as DevNote['category'],
        done: n.done,
        created_at: n.created_at,
      })) as DevNote[];
    },
    enabled: !!user,
  });

  // One-time migration from localStorage to Supabase
  useEffect(() => {
    if (!user || migrated.current) return;
    if (localStorage.getItem(MIGRATED_KEY)) return;
    migrated.current = true;

    try {
      const stored = localStorage.getItem(LOCAL_KEY);
      if (!stored) {
        localStorage.setItem(MIGRATED_KEY, 'true');
        return;
      }
      const notes = JSON.parse(stored) as any[];
      if (!notes.length) {
        localStorage.setItem(MIGRATED_KEY, 'true');
        return;
      }

      const rows = notes.map((n: any) => ({
        text: n.text,
        category: n.category || 'idea',
        done: n.done ?? false,
        user_id: user.id,
        created_at: n.createdAt || new Date().toISOString(),
      }));

      supabase
        .from('dev_notes' as any)
        .insert(rows as any)
        .then(({ error }) => {
          if (!error) {
            localStorage.removeItem(LOCAL_KEY);
            localStorage.setItem(MIGRATED_KEY, 'true');
            queryClient.invalidateQueries({ queryKey: ['dev_notes'] });
          }
        });
    } catch {
      // ignore parse errors
    }
  }, [user, queryClient]);

  const addNote = useMutation({
    mutationFn: async ({ text, category }: { text: string; category: DevNote['category'] }) => {
      const { error } = await supabase
        .from('dev_notes' as any)
        .insert({ text, category, user_id: user!.id } as any);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dev_notes'] }),
  });

  const toggleNote = useMutation({
    mutationFn: async ({ id, done }: { id: string; done: boolean }) => {
      const { error } = await supabase
        .from('dev_notes' as any)
        .update({ done } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dev_notes'] }),
  });

  const removeNote = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('dev_notes' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dev_notes'] }),
  });

  return { devNotes, isLoading, addNote, toggleNote, removeNote };
}
