-- Create relationships table
CREATE TABLE public.relationships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  character_id UUID NOT NULL,
  related_character_id UUID NOT NULL,
  user_id UUID NOT NULL,
  relationship_type TEXT NOT NULL,
  intensity INTEGER NOT NULL DEFAULT 3 CHECK (intensity >= 1 AND intensity <= 5),
  description TEXT,
  is_mutual BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT different_characters CHECK (character_id != related_character_id)
);

-- Enable RLS
ALTER TABLE public.relationships ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own relationships"
  ON public.relationships
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own relationships"
  ON public.relationships
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own relationships"
  ON public.relationships
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own relationships"
  ON public.relationships
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_relationships_updated_at
  BEFORE UPDATE ON public.relationships
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample relationships centered on Rosa Marquez
-- First, get Rosa's ID and user_id
DO $$
DECLARE
  rosa_id UUID;
  rosa_user_id UUID;
  solomon_id UUID;
  sophie_id UUID;
  solveig_id UUID;
BEGIN
  -- Get character IDs
  SELECT id, user_id INTO rosa_id, rosa_user_id FROM public.characters WHERE name = 'Rosa Marquez' LIMIT 1;
  SELECT id INTO solomon_id FROM public.characters WHERE name LIKE 'Solomon%' LIMIT 1;
  SELECT id INTO sophie_id FROM public.characters WHERE name = 'Sophie Moreau' LIMIT 1;
  SELECT id INTO solveig_id FROM public.characters WHERE name = 'Solveig Nordahl' LIMIT 1;

  -- Only insert if Rosa exists
  IF rosa_id IS NOT NULL THEN
    -- Rosa -> Solomon (Information Network)
    IF solomon_id IS NOT NULL THEN
      INSERT INTO public.relationships (character_id, related_character_id, user_id, relationship_type, intensity, description, is_mutual)
      VALUES (rosa_id, solomon_id, rosa_user_id, 'Ally', 4, 'Rosa relies on Solomon for intelligence about corrupt officials and corporate exploitation. He feeds her information in exchange for protection and solidarity.', true);
      
      INSERT INTO public.relationships (character_id, related_character_id, user_id, relationship_type, intensity, description, is_mutual)
      VALUES (solomon_id, rosa_id, rosa_user_id, 'Ally', 4, 'Solomon provides Rosa with crucial information for her activist work. Values her protection and the legitimacy she brings to his operations.', true);
    END IF;

    -- Rosa -> Sophie (Ideological Tension)
    IF sophie_id IS NOT NULL THEN
      INSERT INTO public.relationships (character_id, related_character_id, user_id, relationship_type, intensity, description, is_mutual)
      VALUES (rosa_id, sophie_id, rosa_user_id, 'Rival', 3, 'Rosa sees Sophie as emblematic of the elite disconnect - creating beauty while ignoring suffering. Tension over priorities and methods.', true);
      
      INSERT INTO public.relationships (character_id, related_character_id, user_id, relationship_type, intensity, description, is_mutual)
      VALUES (sophie_id, rosa_id, rosa_user_id, 'Rival', 3, 'Sophie finds Rosa''s methods crude but respects her passion. Wishes she could appreciate art as a form of resistance too.', true);
    END IF;

    -- Rosa -> Solveig (Mutual Respect)
    IF solveig_id IS NOT NULL THEN
      INSERT INTO public.relationships (character_id, related_character_id, user_id, relationship_type, intensity, description, is_mutual)
      VALUES (rosa_id, solveig_id, rosa_user_id, 'Contact', 3, 'Rosa appreciates Solveig''s independence and survival skills. Sees her as someone who understands struggle without political pretense.', false);
      
      INSERT INTO public.relationships (character_id, related_character_id, user_id, relationship_type, intensity, description, is_mutual)
      VALUES (solveig_id, rosa_id, rosa_user_id, 'Contact', 3, 'Solveig respects Rosa''s commitment but stays distant from organized movements. Will help if paths cross naturally.', false);
    END IF;
  END IF;
END $$;