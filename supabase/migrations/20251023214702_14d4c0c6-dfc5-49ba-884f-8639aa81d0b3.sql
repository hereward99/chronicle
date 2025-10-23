-- Create junction table for many-to-many relationship between plots and characters
CREATE TABLE public.plot_characters (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plot_id uuid NOT NULL REFERENCES public.plots(id) ON DELETE CASCADE,
  character_id uuid NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(plot_id, character_id)
);

-- Enable RLS
ALTER TABLE public.plot_characters ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own plot_characters"
ON public.plot_characters
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.plots
    WHERE plots.id = plot_characters.plot_id
    AND plots.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create their own plot_characters"
ON public.plot_characters
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.plots
    WHERE plots.id = plot_characters.plot_id
    AND plots.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own plot_characters"
ON public.plot_characters
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.plots
    WHERE plots.id = plot_characters.plot_id
    AND plots.user_id = auth.uid()
  )
);

-- Create indexes for better query performance
CREATE INDEX idx_plot_characters_plot_id ON public.plot_characters(plot_id);
CREATE INDEX idx_plot_characters_character_id ON public.plot_characters(character_id);

-- Remove plot_id from characters table (moving to junction table)
ALTER TABLE public.characters DROP COLUMN IF EXISTS plot_id;