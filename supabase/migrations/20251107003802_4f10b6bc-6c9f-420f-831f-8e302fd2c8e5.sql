-- Create coteries table
CREATE TABLE public.coteries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chronicle_id UUID NOT NULL,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  domain TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coteries ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own coteries" 
ON public.coteries 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own coteries" 
ON public.coteries 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own coteries" 
ON public.coteries 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own coteries" 
ON public.coteries 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create coterie_members junction table
CREATE TABLE public.coterie_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coterie_id UUID NOT NULL,
  character_id UUID NOT NULL,
  role TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(coterie_id, character_id)
);

-- Enable RLS
ALTER TABLE public.coterie_members ENABLE ROW LEVEL SECURITY;

-- Create policies for coterie_members
CREATE POLICY "Users can view their own coterie members" 
ON public.coterie_members 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM coteries 
  WHERE coteries.id = coterie_members.coterie_id 
  AND coteries.user_id = auth.uid()
));

CREATE POLICY "Users can create their own coterie members" 
ON public.coterie_members 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM coteries 
  WHERE coteries.id = coterie_members.coterie_id 
  AND coteries.user_id = auth.uid()
));

CREATE POLICY "Users can delete their own coterie members" 
ON public.coterie_members 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM coteries 
  WHERE coteries.id = coterie_members.coterie_id 
  AND coteries.user_id = auth.uid()
));

-- Add trigger for updated_at
CREATE TRIGGER update_coteries_updated_at
BEFORE UPDATE ON public.coteries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();