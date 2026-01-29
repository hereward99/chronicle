-- Create boons table for tracking debts and favors between characters
CREATE TABLE public.boons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID NOT NULL,
  chronicle_id UUID NOT NULL REFERENCES public.chronicles(id) ON DELETE CASCADE,
  creditor_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  debtor_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  severity TEXT NOT NULL DEFAULT 'minor' CHECK (severity IN ('trivial', 'minor', 'major', 'life')),
  description TEXT NOT NULL,
  notes TEXT,
  plot_id UUID REFERENCES public.plots(id) ON DELETE SET NULL,
  session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'outstanding' CHECK (status IN ('outstanding', 'fulfilled', 'forgiven')),
  CONSTRAINT different_characters CHECK (creditor_id != debtor_id)
);

-- Enable Row Level Security
ALTER TABLE public.boons ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own boons"
ON public.boons
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own boons"
ON public.boons
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own boons"
ON public.boons
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own boons"
ON public.boons
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_boons_updated_at
BEFORE UPDATE ON public.boons
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups by character
CREATE INDEX idx_boons_creditor ON public.boons(creditor_id);
CREATE INDEX idx_boons_debtor ON public.boons(debtor_id);
CREATE INDEX idx_boons_chronicle ON public.boons(chronicle_id);