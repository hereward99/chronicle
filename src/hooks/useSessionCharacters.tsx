import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SessionCharacter {
  id: string;
  session_id: string;
  character_id: string;
  user_id: string;
  created_at: string;
}

export function useSessionCharacters(sessionId?: string) {
  const queryClient = useQueryClient();

  const { data: sessionCharacters = [], isLoading } = useQuery({
    queryKey: ['session_characters', sessionId],
    queryFn: async () => {
      if (!sessionId) return [];
      const { data, error } = await supabase
        .from('session_characters')
        .select('*')
        .eq('session_id', sessionId);
      if (error) throw error;
      return (data as SessionCharacter[]) || [];
    },
    enabled: !!sessionId,
  });

  const setSessionCharacters = useMutation({
    mutationFn: async ({ sessionId, characterIds }: { sessionId: string; characterIds: string[] }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Delete existing associations
      const { error: deleteError } = await supabase
        .from('session_characters')
        .delete()
        .eq('session_id', sessionId);
      if (deleteError) throw deleteError;

      // Insert new associations
      if (characterIds.length > 0) {
        const rows = characterIds.map(characterId => ({
          session_id: sessionId,
          character_id: characterId,
          user_id: user.id,
        }));
        const { error: insertError } = await supabase
          .from('session_characters')
          .insert(rows);
        if (insertError) throw insertError;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['session_characters', variables.sessionId] });
      queryClient.invalidateQueries({ queryKey: ['session_characters_by_character'] });
    },
  });

  return {
    sessionCharacters,
    characterIds: sessionCharacters.map(sc => sc.character_id),
    isLoading,
    setSessionCharacters: (sessionId: string, characterIds: string[]) =>
      setSessionCharacters.mutateAsync({ sessionId, characterIds }),
  };
}

// Hook to get all sessions for a specific character
export function useCharacterSessions(characterId?: string) {
  const { data: sessionLinks = [], isLoading } = useQuery({
    queryKey: ['session_characters_by_character', characterId],
    queryFn: async () => {
      if (!characterId) return [];
      const { data, error } = await supabase
        .from('session_characters')
        .select('session_id')
        .eq('character_id', characterId);
      if (error) throw error;
      return (data || []).map(d => d.session_id);
    },
    enabled: !!characterId,
  });

  return { sessionIds: sessionLinks, isLoading };
}
