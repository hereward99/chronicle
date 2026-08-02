import { useEntityCrud } from './useEntityCrud';

export interface Plot {
  id: string;
  title: string;
  summary: string | null;
  description: string | null;
  status: string;
  priority: string;
  chronicle_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  attachments?: Array<{ id: string; name: string; url: string; type: string; size: number; uploaded_at: string }>;
  in_game_date_start?: string | null;
  in_game_date_end?: string | null;
}

export function usePlots() {
  const { items: plots, loading, create, update, remove, refetch } = useEntityCrud<Plot>({
    table: 'plots',
    queryKey: 'plots',
    label: 'Story',
    labelPlural: 'Stories',
    orderBy: { column: 'created_at', ascending: false },
    transform: (row: Record<string, unknown>) => ({
      ...((row as unknown) as Plot),
      attachments: ((row.attachments as unknown) as Plot['attachments']) || [],
    }),
    createMessage: (variables) => ({
      title: 'Story created',
      description: `${variables.title} has been added to your chronicle.`,
    }),
    updateMessage: 'Story updated',
    deleteMessage: () => ({
      title: 'Story deleted',
      description: 'The story has been removed from your chronicle.',
    }),
  });

  const createPlot = async (plot: Omit<Plot, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    return create(plot);
  };

  const updatePlot = async (id: string, updates: Partial<Plot>) => {
    return update(id, updates);
  };

  const deletePlot = async (id: string) => {
    return remove(id);
  };

  return { plots, loading, createPlot, updatePlot, deletePlot, refetch };
}
