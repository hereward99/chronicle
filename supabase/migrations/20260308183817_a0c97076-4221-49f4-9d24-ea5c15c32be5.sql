
CREATE TABLE public.dev_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text text NOT NULL,
  category text NOT NULL DEFAULT 'idea',
  done boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.dev_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own dev notes"
  ON public.dev_notes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own dev notes"
  ON public.dev_notes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own dev notes"
  ON public.dev_notes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own dev notes"
  ON public.dev_notes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
