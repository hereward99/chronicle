
-- Create session_characters junction table
CREATE TABLE public.session_characters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (session_id, character_id)
);

-- Enable RLS
ALTER TABLE public.session_characters ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own session_characters"
ON public.session_characters FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own session_characters"
ON public.session_characters FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own session_characters"
ON public.session_characters FOR DELETE
USING (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX idx_session_characters_session ON public.session_characters(session_id);
CREATE INDEX idx_session_characters_character ON public.session_characters(character_id);
