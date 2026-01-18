-- Add plot_id column to sessions table to link sessions to stories
ALTER TABLE public.sessions
ADD COLUMN plot_id uuid REFERENCES public.plots(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX idx_sessions_plot_id ON public.sessions(plot_id);