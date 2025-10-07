-- Make storage buckets publicly readable for thumbnails/doc previews (read-only)

-- Allow public read access to character-files
create policy "Public can view character files"
  on storage.objects
  for select
  to public
  using (bucket_id = 'character-files');

-- Allow public read access to story-files
create policy "Public can view story files"
  on storage.objects
  for select
  to public
  using (bucket_id = 'story-files');

-- Allow public read access to session-files
create policy "Public can view session files"
  on storage.objects
  for select
  to public
  using (bucket_id = 'session-files');