-- Create storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('character-files', 'character-files', false),
  ('story-files', 'story-files', false),
  ('session-files', 'session-files', false);

-- Create RLS policies for character files
CREATE POLICY "Users can view their own character files"
ON storage.objects FOR SELECT
USING (bucket_id = 'character-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own character files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'character-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own character files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'character-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own character files"
ON storage.objects FOR DELETE
USING (bucket_id = 'character-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create RLS policies for story files
CREATE POLICY "Users can view their own story files"
ON storage.objects FOR SELECT
USING (bucket_id = 'story-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own story files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'story-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own story files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'story-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own story files"
ON storage.objects FOR DELETE
USING (bucket_id = 'story-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create RLS policies for session files
CREATE POLICY "Users can view their own session files"
ON storage.objects FOR SELECT
USING (bucket_id = 'session-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own session files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'session-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own session files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'session-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own session files"
ON storage.objects FOR DELETE
USING (bucket_id = 'session-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add file attachment columns to existing tables
ALTER TABLE public.characters 
ADD COLUMN attachments JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.plots 
ADD COLUMN attachments JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.sessions 
ADD COLUMN attachments JSONB DEFAULT '[]'::jsonb;