import { useState, useEffect } from 'react';
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
  // VtM Scene Templates
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
  // VtM Arc Templates
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
  // VtM Session Structure Templates
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

export function useChecklists() {
  const [checklists, setChecklists] = useState<SessionChecklist[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { currentChronicle } = useChronicles();

  const fetchChecklists = async () => {
    if (!currentChronicle?.id) {
      setChecklists([]);
      setLoading(false);
      return;
    }

    try {
      // Fetch checklists
      const { data: checklistData, error: checklistError } = await supabase
        .from('session_checklists')
        .select('*')
        .eq('chronicle_id', currentChronicle.id)
        .order('created_at', { ascending: false });

      if (checklistError) throw checklistError;

      if (!checklistData || checklistData.length === 0) {
        setChecklists([]);
        setLoading(false);
        return;
      }

      // Fetch all items for these checklists
      const checklistIds = checklistData.map(c => c.id);
      const { data: itemsData, error: itemsError } = await supabase
        .from('checklist_items')
        .select('*')
        .in('checklist_id', checklistIds)
        .order('sort_order', { ascending: true });

      if (itemsError) throw itemsError;

      // Combine checklists with their items
      const combined = checklistData.map(checklist => ({
        ...checklist,
        items: (itemsData || []).filter(item => item.checklist_id === checklist.id),
      }));

      setChecklists(combined);
    } catch (error: any) {
      toast({
        title: "Error fetching checklists",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createChecklist = async (
    checklist: { title: string; notes?: string; plot_id?: string | null },
    items: string[]
  ) => {
    if (!currentChronicle?.id) {
      toast({
        title: "No chronicle selected",
        description: "Please select a chronicle first.",
        variant: "destructive",
      });
      return null;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Create checklist
      const { data: checklistData, error: checklistError } = await supabase
        .from('session_checklists')
        .insert([{
          chronicle_id: currentChronicle.id,
          user_id: user.id,
          title: checklist.title,
          notes: checklist.notes || null,
          plot_id: checklist.plot_id || null,
        }])
        .select()
        .single();

      if (checklistError) throw checklistError;

      // Create items
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

      toast({
        title: "Checklist created",
        description: `${checklist.title} has been created.`,
      });

      await fetchChecklists();
      return checklistData;
    } catch (error: any) {
      toast({
        title: "Error creating checklist",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const updateChecklist = async (
    id: string,
    updates: { title?: string; notes?: string; plot_id?: string | null }
  ) => {
    try {
      const { error } = await supabase
        .from('session_checklists')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setChecklists(prev => prev.map(c => 
        c.id === id ? { ...c, ...updates } : c
      ));

      toast({
        title: "Checklist updated",
        description: "Your checklist has been updated.",
      });
    } catch (error: any) {
      toast({
        title: "Error updating checklist",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteChecklist = async (id: string) => {
    try {
      const { error } = await supabase
        .from('session_checklists')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setChecklists(prev => prev.filter(c => c.id !== id));
      toast({
        title: "Checklist deleted",
        description: "The checklist has been deleted.",
      });
    } catch (error: any) {
      toast({
        title: "Error deleting checklist",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const toggleItem = async (itemId: string, isCompleted: boolean) => {
    // Optimistic update
    setChecklists(prev => prev.map(checklist => ({
      ...checklist,
      items: checklist.items.map(item =>
        item.id === itemId ? { ...item, is_completed: isCompleted } : item
      ),
    })));

    try {
      const { error } = await supabase
        .from('checklist_items')
        .update({ is_completed: isCompleted })
        .eq('id', itemId);

      if (error) throw error;
    } catch (error: any) {
      // Rollback on failure
      setChecklists(prev => prev.map(checklist => ({
        ...checklist,
        items: checklist.items.map(item =>
          item.id === itemId ? { ...item, is_completed: !isCompleted } : item
        ),
      })));
      toast({
        title: "Error updating item",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const addItem = async (checklistId: string, text: string) => {
    try {
      const checklist = checklists.find(c => c.id === checklistId);
      const maxOrder = checklist?.items.reduce((max, item) => 
        Math.max(max, item.sort_order), -1) ?? -1;

      const { data, error } = await supabase
        .from('checklist_items')
        .insert([{
          checklist_id: checklistId,
          text,
          sort_order: maxOrder + 1,
          is_completed: false,
        }])
        .select()
        .single();

      if (error) throw error;

      setChecklists(prev => prev.map(c =>
        c.id === checklistId
          ? { ...c, items: [...c.items, data] }
          : c
      ));

      return data;
    } catch (error: any) {
      toast({
        title: "Error adding item",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const updateItem = async (itemId: string, text: string) => {
    try {
      const { error } = await supabase
        .from('checklist_items')
        .update({ text })
        .eq('id', itemId);

      if (error) throw error;

      setChecklists(prev => prev.map(checklist => ({
        ...checklist,
        items: checklist.items.map(item =>
          item.id === itemId ? { ...item, text } : item
        ),
      })));
    } catch (error: any) {
      toast({
        title: "Error updating item",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('checklist_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      setChecklists(prev => prev.map(checklist => ({
        ...checklist,
        items: checklist.items.filter(item => item.id !== itemId),
      })));
    } catch (error: any) {
      toast({
        title: "Error deleting item",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchChecklists();
  }, [currentChronicle?.id]);

  return {
    checklists,
    loading,
    createChecklist,
    updateChecklist,
    deleteChecklist,
    toggleItem,
    addItem,
    updateItem,
    deleteItem,
    refetch: fetchChecklists,
  };
}
