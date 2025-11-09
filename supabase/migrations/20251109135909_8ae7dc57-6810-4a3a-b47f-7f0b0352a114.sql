-- Create factions table
CREATE TABLE public.factions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chronicle_id UUID NOT NULL,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL DEFAULT '#64748b',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on factions
ALTER TABLE public.factions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for factions
CREATE POLICY "Users can view their own factions"
  ON public.factions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own factions"
  ON public.factions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own factions"
  ON public.factions
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own factions"
  ON public.factions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create character_factions junction table
CREATE TABLE public.character_factions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  character_id UUID NOT NULL,
  faction_id UUID NOT NULL,
  role TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(character_id, faction_id)
);

-- Enable RLS on character_factions
ALTER TABLE public.character_factions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for character_factions
CREATE POLICY "Users can view their own character factions"
  ON public.character_factions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.characters
      WHERE characters.id = character_factions.character_id
      AND characters.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own character factions"
  ON public.character_factions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.characters
      WHERE characters.id = character_factions.character_id
      AND characters.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own character factions"
  ON public.character_factions
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.characters
      WHERE characters.id = character_factions.character_id
      AND characters.user_id = auth.uid()
    )
  );

-- Create trigger for updated_at on factions
CREATE TRIGGER update_factions_updated_at
  BEFORE UPDATE ON public.factions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();