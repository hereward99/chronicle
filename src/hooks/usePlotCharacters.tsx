import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface PlotCharacter {
  id: string;
  plot_id: string;
  character_id: string;
  created_at: string;
}

export function usePlotCharacters(plotId?: string) {
  const [plotCharacters, setPlotCharacters] = useState<PlotCharacter[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPlotCharacters = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("plot_characters")
        .select("*")
        .order("created_at", { ascending: false });

      if (plotId) {
        query = query.eq("plot_id", plotId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPlotCharacters(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading plot characters",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const assignCharacter = async (plotId: string, characterId: string) => {
    try {
      const { error } = await supabase
        .from("plot_characters")
        .insert({ plot_id: plotId, character_id: characterId });

      if (error) throw error;

      await fetchPlotCharacters();
    } catch (error: any) {
      toast({
        title: "Error assigning character",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const unassignCharacter = async (plotId: string, characterId: string) => {
    try {
      const { error } = await supabase
        .from("plot_characters")
        .delete()
        .eq("plot_id", plotId)
        .eq("character_id", characterId);

      if (error) throw error;

      await fetchPlotCharacters();
    } catch (error: any) {
      toast({
        title: "Error unassigning character",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const getCharactersForPlot = (plotId: string): string[] => {
    return plotCharacters
      .filter((pc) => pc.plot_id === plotId)
      .map((pc) => pc.character_id);
  };

  useEffect(() => {
    fetchPlotCharacters();
  }, [plotId]);

  return {
    plotCharacters,
    loading,
    assignCharacter,
    unassignCharacter,
    getCharactersForPlot,
    refetch: fetchPlotCharacters,
  };
}
