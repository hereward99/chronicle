-- Create table for session prep checklists
CREATE TABLE public.session_checklists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chronicle_id UUID NOT NULL REFERENCES public.chronicles(id) ON DELETE CASCADE,
  plot_id UUID REFERENCES public.plots(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for checklist items
CREATE TABLE public.checklist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  checklist_id UUID NOT NULL REFERENCES public.session_checklists(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on session_checklists
ALTER TABLE public.session_checklists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own checklists"
ON public.session_checklists FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own checklists"
ON public.session_checklists FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own checklists"
ON public.session_checklists FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own checklists"
ON public.session_checklists FOR DELETE
USING (auth.uid() = user_id);

-- Enable RLS on checklist_items (via checklist ownership)
ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own checklist items"
ON public.checklist_items FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.session_checklists
  WHERE session_checklists.id = checklist_items.checklist_id
  AND session_checklists.user_id = auth.uid()
));

CREATE POLICY "Users can create their own checklist items"
ON public.checklist_items FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.session_checklists
  WHERE session_checklists.id = checklist_items.checklist_id
  AND session_checklists.user_id = auth.uid()
));

CREATE POLICY "Users can update their own checklist items"
ON public.checklist_items FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.session_checklists
  WHERE session_checklists.id = checklist_items.checklist_id
  AND session_checklists.user_id = auth.uid()
));

CREATE POLICY "Users can delete their own checklist items"
ON public.checklist_items FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.session_checklists
  WHERE session_checklists.id = checklist_items.checklist_id
  AND session_checklists.user_id = auth.uid()
));

-- Add updated_at trigger
CREATE TRIGGER update_session_checklists_updated_at
BEFORE UPDATE ON public.session_checklists
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();