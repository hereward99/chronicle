import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Activity {
  id: string;
  type: 'character' | 'session' | 'plot' | 'note';
  action: string;
  timestamp: string;
}

export function useRecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchActivities = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Fetch recent characters (last 10)
      const { data: characters, error: charError } = await supabase
        .from('characters')
        .select('id, name, created_at, updated_at')
        .order('created_at', { ascending: false })
        .limit(10);

      if (charError) throw charError;

      // Fetch recent sessions (last 10)
      const { data: sessions, error: sessError } = await supabase
        .from('sessions')
        .select('id, title, created_at, updated_at')
        .order('created_at', { ascending: false })
        .limit(10);

      if (sessError) throw sessError;

      // Fetch recent plots (last 10)
      const { data: plots, error: plotError } = await supabase
        .from('plots')
        .select('id, title, created_at, updated_at')
        .order('created_at', { ascending: false })
        .limit(10);

      if (plotError) throw plotError;

      // Fetch recent notes (last 10)
      const { data: notes, error: noteError } = await supabase
        .from('notes')
        .select('id, title, created_at, updated_at')
        .order('created_at', { ascending: false })
        .limit(10);

      if (noteError) throw noteError;

      // Combine all activities
      const allActivities: Activity[] = [
        ...(characters || []).map(char => ({
          id: char.id,
          type: 'character' as const,
          action: `Created character: ${char.name}`,
          timestamp: char.created_at,
        })),
        ...(sessions || []).map(session => ({
          id: session.id,
          type: 'session' as const,
          action: `Logged session: ${session.title}`,
          timestamp: session.created_at,
        })),
        ...(plots || []).map(plot => ({
          id: plot.id,
          type: 'plot' as const,
          action: `Created plot: ${plot.title}`,
          timestamp: plot.created_at,
        })),
        ...(notes || []).map(note => ({
          id: note.id,
          type: 'note' as const,
          action: `Added note: ${note.title}`,
          timestamp: note.created_at,
        })),
      ];

      // Sort by timestamp (most recent first) and take top 5
      const sortedActivities = allActivities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 5);

      setActivities(sortedActivities);
    } catch (error: any) {
      toast({
        title: "Error fetching recent activity",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  return {
    activities,
    loading,
    refetch: fetchActivities,
  };
}
