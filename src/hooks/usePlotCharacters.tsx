import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface PlotCharacter {
  id: string;
  plot_id: string;
  character_id: string;
  created_at: string;
}

export function usePlotCharacters(plotId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: plotCharacters = [], isLoading: loading } = useQuery({
    queryKey: ['plot_characters', plotId ?? 'all'],
    queryFn: async () => {
      let query = supabase
        .from("plot_characters")
        .select("*")
        .order("created_at", { ascending: false });

      if (plotId) {
        query = query.eq("plot_id", plotId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as PlotCharacter[];
    },
  });

  const assignCharacterMutation = useMutation({
    mutationFn: async ({ plotId, characterId }: { plotId: string; characterId: string }) => {
      const { error } = await supabase
        .from("plot_characters")
        .insert({ plot_id: plotId, character_id: characterId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plot_characters'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error assigning character",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const unassignCharacterMutation = useMutation({
    mutationFn: async ({ plotId, characterId }: { plotId: string; characterId: string }) => {
      const { error } = await supabase
        .from("plot_characters")
        .delete()
        .eq("plot_id", plotId)
        .eq("character_id", characterId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plot_characters'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error unassigning character",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getCharactersForPlot = (targetPlotId: string): string[] => {
    return plotCharacters
      .filter((pc) => pc.plot_id === targetPlotId)
      .map((pc) => pc.character_id);
  };

  return {
    plotCharacters,
    loading,
    assignCharacter: (plotId: string, characterId: string) =>
      assignCharacterMutation.mutateAsync({ plotId, characterId }),
    unassignCharacter: (plotId: string, characterId: string) =>
      unassignCharacterMutation.mutateAsync({ plotId, characterId }),
    getCharactersForPlot,
    refetch: () => queryClient.invalidateQueries({ queryKey: ['plot_characters'] }),
  };
}
