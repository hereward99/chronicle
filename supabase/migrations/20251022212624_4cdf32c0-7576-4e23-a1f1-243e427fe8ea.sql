-- Add plot_id column to characters table to enable character-plot associations
ALTER TABLE public.characters
ADD COLUMN plot_id uuid REFERENCES public.plots(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX idx_characters_plot_id ON public.characters(plot_id);