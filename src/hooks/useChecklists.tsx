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
    try {
      const { error } = await supabase
        .from('checklist_items')
        .update({ is_completed: isCompleted })
        .eq('id', itemId);

      if (error) throw error;

      setChecklists(prev => prev.map(checklist => ({
        ...checklist,
        items: checklist.items.map(item =>
          item.id === itemId ? { ...item, is_completed: isCompleted } : item
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
