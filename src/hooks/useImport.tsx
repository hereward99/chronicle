import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useChronicles } from "@/hooks/useChronicles";

export type ImportType = "chronicle" | "character" | "story" | "session";

interface ImportResult {
  success: boolean;
  message: string;
  count: number;
}

export function useImport() {
  const [importing, setImporting] = useState(false);
  const { toast } = useToast();
  const { currentChronicle, refetch: refetchChronicles } = useChronicles();

  const importChronicles = async (data: any[]): Promise<ImportResult> => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("Not authenticated");

    let successCount = 0;
    for (const chronicle of data) {
      const { error } = await supabase.from("chronicles").insert({
        user_id: userData.user.id,
        name: chronicle.name,
        description: chronicle.description || null,
        setting: chronicle.setting || null,
      });
      if (!error) successCount++;
    }

    await refetchChronicles();
    return { success: successCount > 0, message: `Imported ${successCount} chronicle(s)`, count: successCount };
  };

  const importCharacters = async (data: any[]): Promise<ImportResult> => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("Not authenticated");

    if (!currentChronicle) {
      throw new Error("Please select a chronicle first");
    }

    let successCount = 0;
    for (const char of data) {
      // Calculate health and willpower from attributes
      const stamina = char.stamina || 1;
      const composure = char.composure || 1;
      const resolve = char.resolve || 1;
      const healthMax = stamina + 3;
      const willpowerMax = composure + resolve;

      const { error } = await supabase.from("characters").insert({
        user_id: userData.user.id,
        chronicle_id: currentChronicle.id,
        name: char.name,
        clan: char.clan || "Unknown",
        generation: char.generation || 13,
        type: char.type || "PC",
        status: char.status || "Active",
        concept: char.concept || null,
        sire: char.sire || null,
        predator_type: char.predator_type || null,
        ambition: char.ambition || null,
        desire: char.desire || null,
        resonance: char.resonance || null,
        appearance: char.appearance || null,
        distinguishing_features: char.distinguishing_features || null,
        history: char.history || null,
        notes: char.notes || null,
        strength: char.strength || 1,
        dexterity: char.dexterity || 1,
        stamina: stamina,
        charisma: char.charisma || 1,
        manipulation: char.manipulation || 1,
        composure: composure,
        intelligence: char.intelligence || 1,
        wits: char.wits || 1,
        resolve: resolve,
        skills: char.skills || {},
        disciplines: char.disciplines || [],
        powers: char.powers || [],
        advantages: char.advantages || [],
        flaws: char.flaws || [],
        convictions: char.convictions || [],
        touchstones: char.touchstones || [],
        loresheets: char.loresheets || [],
        blood_potency: char.blood_potency || 0,
        humanity: char.humanity || 7,
        hunger: char.hunger || 1,
        health_max: healthMax,
        health_superficial: 0,
        health_aggravated: 0,
        willpower_max: willpowerMax,
        willpower_superficial: 0,
        willpower_aggravated: 0,
        experience_total: char.experience_total || 0,
        experience_spent: char.experience_spent || 0,
      });
      if (!error) successCount++;
    }

    return { success: successCount > 0, message: `Imported ${successCount} character(s)`, count: successCount };
  };

  const importStories = async (data: any[]): Promise<ImportResult> => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("Not authenticated");

    if (!currentChronicle) {
      throw new Error("Please select a chronicle first");
    }

    let successCount = 0;
    for (const story of data) {
      const { error } = await supabase.from("plots").insert({
        user_id: userData.user.id,
        chronicle_id: currentChronicle.id,
        title: story.title,
        description: story.description || null,
        status: story.status || "Active",
        priority: story.priority || "Medium",
      });
      if (!error) successCount++;
    }

    return { success: successCount > 0, message: `Imported ${successCount} story/stories`, count: successCount };
  };

  const importSessions = async (data: any[]): Promise<ImportResult> => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("Not authenticated");

    if (!currentChronicle) {
      throw new Error("Please select a chronicle first");
    }

    let successCount = 0;
    for (const session of data) {
      const { error } = await supabase.from("sessions").insert({
        user_id: userData.user.id,
        chronicle_id: currentChronicle.id,
        title: session.title,
        summary: session.summary || null,
        date_played: session.date_played || new Date().toISOString().split("T")[0],
        experience_awarded: session.experience_awarded || 0,
      });
      if (!error) successCount++;
    }

    return { success: successCount > 0, message: `Imported ${successCount} session(s)`, count: successCount };
  };

  const parseAndImport = async (file: File, importType: ImportType): Promise<ImportResult> => {
    setImporting(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      // Handle both single object and array formats
      const dataArray = Array.isArray(parsed) ? parsed : [parsed];

      if (dataArray.length === 0) {
        throw new Error("No data found in file");
      }

      let result: ImportResult;
      switch (importType) {
        case "chronicle":
          result = await importChronicles(dataArray);
          break;
        case "character":
          result = await importCharacters(dataArray);
          break;
        case "story":
          result = await importStories(dataArray);
          break;
        case "session":
          result = await importSessions(dataArray);
          break;
        default:
          throw new Error("Unknown import type");
      }

      toast({
        title: "Import successful",
        description: result.message,
      });

      return result;
    } catch (error: any) {
      const message = error.message || "Failed to import data";
      toast({
        title: "Import failed",
        description: message,
        variant: "destructive",
      });
      return { success: false, message, count: 0 };
    } finally {
      setImporting(false);
    }
  };

  return {
    importing,
    parseAndImport,
    currentChronicle,
  };
}
