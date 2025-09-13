import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface ChronicleStats {
  characters: { total: number; pcs: number; npcs: number };
  sessions: { total: number; lastSession: string | null };
  plots: { total: number; active: number };
  notes: { total: number };
}

export function useChronicleStats() {
  const [stats, setStats] = useState<ChronicleStats>({
    characters: { total: 0, pcs: 0, npcs: 0 },
    sessions: { total: 0, lastSession: null },
    plots: { total: 0, active: 0 },
    notes: { total: 0 },
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchStats = async () => {
    try {
      const [charactersRes, sessionsRes, plotsRes, notesRes] = await Promise.all([
        supabase.from('characters').select('type'),
        supabase.from('sessions').select('date_played').order('date_played', { ascending: false }),
        supabase.from('plots').select('status'),
        supabase.from('notes').select('id'),
      ]);

      if (charactersRes.error) throw charactersRes.error;
      if (sessionsRes.error) throw sessionsRes.error;
      if (plotsRes.error) throw plotsRes.error;
      if (notesRes.error) throw notesRes.error;

      const characters = charactersRes.data || [];
      const sessions = sessionsRes.data || [];
      const plots = plotsRes.data || [];
      const notes = notesRes.data || [];

      setStats({
        characters: {
          total: characters.length,
          pcs: characters.filter(c => c.type === 'PC').length,
          npcs: characters.filter(c => c.type === 'NPC').length,
        },
        sessions: {
          total: sessions.length,
          lastSession: sessions[0]?.date_played || null,
        },
        plots: {
          total: plots.length,
          active: plots.filter(p => p.status === 'Active' || p.status === 'Critical').length,
        },
        notes: {
          total: notes.length,
        },
      });
    } catch (error: any) {
      toast({
        title: "Error fetching chronicle stats",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return { stats, loading, refetch: fetchStats };
}