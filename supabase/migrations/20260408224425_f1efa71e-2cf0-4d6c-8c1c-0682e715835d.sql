
ALTER TABLE coteries
  ADD COLUMN coterie_type text,
  ADD COLUMN city text,
  ADD COLUMN chasse integer NOT NULL DEFAULT 0,
  ADD COLUMN portillon integer NOT NULL DEFAULT 0,
  ADD COLUMN lien integer NOT NULL DEFAULT 0,
  ADD COLUMN domain_merits text,
  ADD COLUMN domain_resonance text,
  ADD COLUMN haven_location text,
  ADD COLUMN haven_merits_and_flaws text,
  ADD COLUMN coterie_advantages_and_flaws text,
  ADD COLUMN coterie_boons_and_debts text,
  ADD COLUMN chronicle_tenets text,
  ADD COLUMN coterie_goals text,
  ADD COLUMN attachments jsonb DEFAULT '[]';

INSERT INTO storage.buckets (id, name, public) VALUES ('coterie-files', 'coterie-files', true);

CREATE POLICY "Auth users upload coterie files" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'coterie-files');
CREATE POLICY "Anyone can view coterie files" ON storage.objects FOR SELECT
  USING (bucket_id = 'coterie-files');
CREATE POLICY "Auth users delete own coterie files" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'coterie-files' AND (storage.foldername(name))[1] = auth.uid()::text);
