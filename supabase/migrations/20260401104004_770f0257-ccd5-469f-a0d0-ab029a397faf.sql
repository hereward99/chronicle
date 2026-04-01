
-- Add attachments column to locations
ALTER TABLE public.locations ADD COLUMN attachments jsonb DEFAULT '[]'::jsonb;

-- Create location-files storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('location-files', 'location-files', true);

-- RLS policies for location-files bucket
CREATE POLICY "Users can upload location files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'location-files' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own location files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'location-files' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone can view location files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'location-files');
