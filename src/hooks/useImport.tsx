import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useChronicles } from "@/hooks/useChronicles";

export type ImportType = "chronicle" | "character" | "story" | "session";
export type ImportMode = "create" | "update";

interface ImportResult {
  success: boolean;
  message: string;
  count: number;
  updatedCount?: number;
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

  const importCharacters = async (data: any[], mode: ImportMode = "create"): Promise<ImportResult> => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("Not authenticated");

    if (!currentChronicle) {
      throw new Error("Please select a chronicle first");
    }

    let successCount = 0;
    let updatedCount = 0;

    for (const char of data) {
      // Calculate health and willpower from attributes
      const stamina = char.stamina || 1;
      const composure = char.composure || 1;
      const resolve = char.resolve || 1;
      const healthMax = stamina + 3;
      const willpowerMax = composure + resolve;

      if (mode === "update") {
        // Try to find existing character by name in this chronicle
        const { data: existingChars } = await supabase
          .from("characters")
          .select("id")
          .eq("chronicle_id", currentChronicle.id)
          .eq("name", char.name)
          .limit(1);

        if (existingChars && existingChars.length > 0) {
          // Update existing character - only update fields that are provided
          const updateData: Record<string, any> = {};
          
          // Only update fields that exist in the import data
          if (char.clan !== undefined) updateData.clan = char.clan;
          if (char.generation !== undefined) updateData.generation = char.generation;
          if (char.type !== undefined) updateData.type = char.type;
          if (char.status !== undefined) updateData.status = char.status;
          if (char.concept !== undefined) updateData.concept = char.concept;
          if (char.sire !== undefined) updateData.sire = char.sire;
          if (char.predator_type !== undefined) updateData.predator_type = char.predator_type;
          if (char.ambition !== undefined) updateData.ambition = char.ambition;
          if (char.desire !== undefined) updateData.desire = char.desire;
          if (char.resonance !== undefined) updateData.resonance = char.resonance;
          if (char.appearance !== undefined) updateData.appearance = char.appearance;
          if (char.distinguishing_features !== undefined) updateData.distinguishing_features = char.distinguishing_features;
          if (char.history !== undefined) updateData.history = char.history;
          if (char.notes !== undefined) updateData.notes = char.notes;
          if (char.strength !== undefined) updateData.strength = char.strength;
          if (char.dexterity !== undefined) updateData.dexterity = char.dexterity;
          if (char.stamina !== undefined) {
            updateData.stamina = char.stamina;
            updateData.health_max = char.stamina + 3;
          }
          if (char.charisma !== undefined) updateData.charisma = char.charisma;
          if (char.manipulation !== undefined) updateData.manipulation = char.manipulation;
          if (char.composure !== undefined) updateData.composure = char.composure;
          if (char.intelligence !== undefined) updateData.intelligence = char.intelligence;
          if (char.wits !== undefined) updateData.wits = char.wits;
          if (char.resolve !== undefined) updateData.resolve = char.resolve;
          // Recalculate willpower if either composure or resolve changed
          if (char.composure !== undefined || char.resolve !== undefined) {
            updateData.willpower_max = (char.composure || composure) + (char.resolve || resolve);
          }
          if (char.skills !== undefined) updateData.skills = char.skills;
          if (char.disciplines !== undefined) updateData.disciplines = char.disciplines;
          if (char.powers !== undefined) updateData.powers = char.powers;
          if (char.advantages !== undefined) updateData.advantages = char.advantages;
          if (char.flaws !== undefined) updateData.flaws = char.flaws;
          if (char.convictions !== undefined) updateData.convictions = char.convictions;
          if (char.touchstones !== undefined) updateData.touchstones = char.touchstones;
          if (char.loresheets !== undefined) updateData.loresheets = char.loresheets;
          if (char.blood_potency !== undefined) updateData.blood_potency = char.blood_potency;
          if (char.humanity !== undefined) updateData.humanity = char.humanity;
          if (char.hunger !== undefined) updateData.hunger = char.hunger;
          if (char.experience_total !== undefined) updateData.experience_total = char.experience_total;
          if (char.experience_spent !== undefined) updateData.experience_spent = char.experience_spent;

          const { error } = await supabase
            .from("characters")
            .update(updateData)
            .eq("id", existingChars[0].id);

          if (!error) updatedCount++;
          continue;
        }
      }

      // Create new character
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

    if (mode === "update") {
      const messages: string[] = [];
      if (updatedCount > 0) messages.push(`Updated ${updatedCount} character(s)`);
      if (successCount > 0) messages.push(`Created ${successCount} new character(s)`);
      return { 
        success: updatedCount > 0 || successCount > 0, 
        message: messages.join(", ") || "No characters matched",
        count: successCount,
        updatedCount
      };
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

  const parseAndImport = async (file: File, importType: ImportType, mode: ImportMode = "create"): Promise<ImportResult> => {
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
          result = await importCharacters(dataArray, mode);
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
        title: mode === "update" ? "Update successful" : "Import successful",
        description: result.message,
      });

      return result;
    } catch (error: any) {
      const message = error.message || "Failed to import data";
      toast({
        title: mode === "update" ? "Update failed" : "Import failed",
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
