import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useChronicles } from '@/hooks/useChronicles';

export interface ChecklistItem {
  id: string;
  checklist_id: string;
  text: string;
  is_completed: boolean;
  sort_order: number;
  created_at: string;
}

export interface SessionChecklist {
  id: string;
  chronicle_id: string;
  plot_id: string | null;
  user_id: string;
  title: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  items: ChecklistItem[];
}

// Common templates for session prep
export const CHECKLIST_TEMPLATES = {
  basic: {
    name: 'Basic Session Prep',
    items: [
      'Review previous session notes',
      'Prepare NPC motivations and goals',
      'Review PC backgrounds and hooks',
      'Prepare encounter locations',
      'Print/prepare handouts if needed',
      'Set up atmosphere (music, lighting)',
    ],
  },
  combat: {
    name: 'Combat-Heavy Session',
    items: [
      'Prepare enemy stat blocks',
      'Map out combat locations',
      'Review initiative and combat rules',
      'Prepare loot/rewards',
      'Plan dramatic moments',
      'Have backup encounters ready',
    ],
  },
  social: {
    name: 'Social/Political Session',
    items: [
      'Review faction relationships',
      'Prepare NPC personalities and mannerisms',
      'List key information NPCs can share',
      'Prepare rumors and gossip',
      'Plan potential boons/favors',
      'Review etiquette rules if applicable',
    ],
  },
  investigation: {
    name: 'Investigation Session',
    items: [
      'List all clues and where they can be found',
      'Prepare red herrings',
      'Map connections between evidence',
      'Prepare witness testimonies',
      'Plan backup clue delivery methods',
      'Prepare revelation moments',
    ],
  },
  elysium: {
    name: 'Elysium Gathering',
    items: [
      'Plan arrival order and first impressions',
      'Prepare rumors circulating among Kindred',
      'Define political maneuvering opportunities',
      "Script the Prince's announcement or agenda",
      'Plan aftermath — private meetings and whispered deals',
      'Note which NPCs are watching whom',
      'Prepare Elysium rules and consequences for violations',
    ],
  },
  domainHunt: {
    name: 'Domain Hunt',
    items: [
      'Define hunting ground and its resonance',
      'Plan the approach — how does the Kindred stalk prey?',
      'Determine the feed — resonance targeting and outcomes',
      'Prepare complications (witnesses, thin-blooded, rivals)',
      'Plan covering tracks — Masquerade maintenance',
      'Note potential Humanity checks from the hunt',
    ],
  },
  court: {
    name: 'Court Proceedings',
    items: [
      'Script formal introductions and protocol',
      'Prepare accusations, petitions, or grievances',
      "Define the Prince's judgment and reasoning",
      'Plan boon negotiations and political trades',
      'Prepare whispered alliances and side deals',
      'Note consequences for disrespect or breaches of Tradition',
    ],
  },
  bloodHunt: {
    name: 'Blood Hunt',
    items: [
      'Script the formal declaration and its justification',
      'Define who allies with the hunters vs. the quarry',
      'Plan tracking and pursuit scenes',
      'Prepare the confrontation — location, stakes, escape routes',
      'Define political fallout — who gains, who loses?',
      'Plan Humanity consequences for participants',
    ],
  },
  newKindred: {
    name: 'New Kindred in Town',
    items: [
      'Plant first sightings and rumors among NPCs',
      'Prepare investigation opportunities for PCs',
      'Script the initial meeting — hostile, cautious, or friendly?',
      'Plan the presentation to the Prince',
      'Define integration path or conflict triggers',
      'Determine the newcomer\'s true agenda',
    ],
  },
  sectConflict: {
    name: 'Sect Conflict',
    items: [
      'Define intelligence-gathering opportunities for each side',
      'Present choice points — who do the PCs support?',
      'Plan the skirmish — location, combatants, collateral',
      'Prepare betrayal possibilities and double agents',
      'Script resolution or escalation outcomes',
      'Note Masquerade breach risks and consequences',
    ],
  },
  threeAct: {
    name: 'Classic Three-Act (VtM)',
    items: [
      'Act I — Define the opening hook (threat, mystery, or opportunity)',
      'Act I — Establish which NPCs deliver the hook',
      'Act II — Plan rising tension and complications',
      'Act II — Identify moments that push toward Humanity checks',
      'Act II — Prepare a mid-session twist or revelation',
      'Act III — Script the climax and key decision point',
      'Act III — Define consequences and loose threads for next session',
    ],
  },
  downtime: {
    name: 'Downtime Session',
    items: [
      'Haven maintenance — security, comfort, concealment',
      'Mortal ties — touchstone scenes and Humanity anchors',
      'Feeding — routine hunts and resonance goals',
      'Personal projects — research, influence, crafting',
      'Advance long-term plots — faction moves, sire demands',
      'Rumor drops — seeds for upcoming sessions',
      'XP spends — discipline training or skill improvement scenes',
    ],
  },
};

async function fetchChecklists(chronicleId: string): Promise<SessionChecklist[]> {
  const { data: checklistData, error: checklistError } = await supabase
    .from('session_checklists')
    .select('*')
    .eq('chronicle_id', chronicleId)
    .order('created_at', { ascending: false });

  if (checklistError) throw checklistError;
  if (!checklistData || checklistData.length === 0) return [];

  const checklistIds = checklistData.map(c => c.id);
  const { data: itemsData, error: itemsError } = await supabase
    .from('checklist_items')
    .select('*')
    .in('checklist_id', checklistIds)
    .order('sort_order', { ascending: true });

  if (itemsError) throw itemsError;

  return checklistData.map(checklist => ({
    ...checklist,
    items: (itemsData || []).filter(item => item.checklist_id === checklist.id),
  }));
}

export function useChecklists() {
  const { toast } = useToast();
  const { currentChronicle } = useChronicles();
  const queryClient = useQueryClient();
  const chronicleId = currentChronicle?.id;
  const queryKey = ['checklists', chronicleId];

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchChecklists(chronicleId!),
    enabled: !!chronicleId,
  });

  const createMutation = useMutation({
    mutationFn: async ({ checklist, items }: {
      checklist: { title: string; notes?: string; plot_id?: string | null };
      items: string[];
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: checklistData, error: checklistError } = await supabase
        .from('session_checklists')
        .insert([{
          chronicle_id: chronicleId!,
          user_id: user.id,
          title: checklist.title,
          notes: checklist.notes || null,
          plot_id: checklist.plot_id || null,
        }])
        .select()
        .single();

      if (checklistError) throw checklistError;

      if (items.length > 0) {
        const itemsToInsert = items.map((text, index) => ({
          checklist_id: checklistData.id,
          text,
          sort_order: index,
          is_completed: false,
        }));
        const { error: itemsError } = await supabase
          .from('checklist_items')
          .insert(itemsToInsert);
        if (itemsError) throw itemsError;
      }

      return checklistData;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey });
      notify.success("Checklist created", `${variables.checklist.title} has been created.`);
    },
    onError: (error: Error) => {
      notify.error("Error creating checklist", error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: {
      id: string;
      updates: { title?: string; notes?: string; plot_id?: string | null };
    }) => {
      const { error } = await supabase
        .from('session_checklists')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      notify.success("Checklist updated", "Your checklist has been updated.");
    },
    onError: (error: Error) => {
      notify.error("Error updating checklist", error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('session_checklists')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      notify.success("Checklist deleted", "The checklist has been deleted.");
    },
    onError: (error: Error) => {
      notify.error("Error deleting checklist", error.message);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ itemId, isCompleted }: { itemId: string; isCompleted: boolean }) => {
      const { error } = await supabase
        .from('checklist_items')
        .update({ is_completed: isCompleted })
        .eq('id', itemId);
      if (error) throw error;
    },
    onMutate: async ({ itemId, isCompleted }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<SessionChecklist[]>(queryKey);
      queryClient.setQueryData<SessionChecklist[]>(queryKey, old =>
        (old || []).map(checklist => ({
          ...checklist,
          items: checklist.items.map(item =>
            item.id === itemId ? { ...item, is_completed: isCompleted } : item
          ),
        }))
      );
      return { previous };
    },
    onError: (error: Error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
      notify.error("Error updating item", error.message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const addItemMutation = useMutation({
    mutationFn: async ({ checklistId, text }: { checklistId: string; text: string }) => {
      const currentChecklists = queryClient.getQueryData<SessionChecklist[]>(queryKey) || [];
      const checklist = currentChecklists.find(c => c.id === checklistId);
      const maxOrder = checklist?.items.reduce((max, item) => Math.max(max, item.sort_order), -1) ?? -1;

      const { data, error } = await supabase
        .from('checklist_items')
        .insert([{ checklist_id: checklistId, text, sort_order: maxOrder + 1, is_completed: false }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error: Error) => {
      notify.error("Error adding item", error.message);
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ itemId, text }: { itemId: string; text: string }) => {
      const { error } = await supabase
        .from('checklist_items')
        .update({ text })
        .eq('id', itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error: Error) => {
      notify.error("Error updating item", error.message);
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('checklist_items')
        .delete()
        .eq('id', itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error: Error) => {
      notify.error("Error deleting item", error.message);
    },
  });

  // Wrapper functions to preserve the existing API shape
  const createChecklist = async (
    checklist: { title: string; notes?: string; plot_id?: string | null },
    items: string[]
  ) => {
    if (!chronicleId) {
      notify.error("No chronicle selected", "Please select a chronicle first.");
      return null;
    }
    try {
      return await createMutation.mutateAsync({ checklist, items });
    } catch {
      return null;
    }
  };

  const updateChecklist = async (
    id: string,
    updates: { title?: string; notes?: string; plot_id?: string | null }
  ) => {
    await updateMutation.mutateAsync({ id, updates });
  };

  const deleteChecklist = async (id: string) => {
    await deleteMutation.mutateAsync(id);
  };

  const toggleItem = async (itemId: string, isCompleted: boolean) => {
    await toggleMutation.mutateAsync({ itemId, isCompleted });
  };

  const addItem = async (checklistId: string, text: string) => {
    try {
      return await addItemMutation.mutateAsync({ checklistId, text });
    } catch {
      return null;
    }
  };

  const updateItem = async (itemId: string, text: string) => {
    await updateItemMutation.mutateAsync({ itemId, text });
  };

  const deleteItem = async (itemId: string) => {
    await deleteItemMutation.mutateAsync(itemId);
  };

  return {
    checklists: data ?? [],
    loading: isLoading,
    createChecklist,
    updateChecklist,
    deleteChecklist,
    toggleItem,
    addItem,
    updateItem,
    deleteItem,
    refetch: () => queryClient.invalidateQueries({ queryKey }),
  };
}
