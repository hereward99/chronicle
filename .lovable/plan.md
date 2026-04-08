

## Build V5 Coterie Sheet with File Attachments

### Overview

Add 13 new columns to the `coteries` table for V5 Coterie Sheet fields, create a `coterie-files` storage bucket, integrate coteries as a tab on the Characters page with full V5 sheet display, and support file uploads.

### 1. Database Migration

Add columns to `coteries`:

```sql
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
```

Create storage bucket + RLS:

```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('coterie-files', 'coterie-files', true);

CREATE POLICY "Auth users upload coterie files" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'coterie-files');
CREATE POLICY "Anyone can view coterie files" ON storage.objects FOR SELECT
  USING (bucket_id = 'coterie-files');
CREATE POLICY "Auth users delete own coterie files" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'coterie-files' AND (storage.foldername(name))[1] = auth.uid()::text);
```

### 2. New Component: DotRating

`src/components/characters/DotRating.tsx` — reusable 1-5 filled/empty circle display with optional click-to-edit. Used for Chasse, Portillon, Lien.

### 3. New Component: CoterieCard

`src/components/characters/CoterieCard.tsx` — expandable card displaying:
- Header: name, type, city, primary badge
- Domain: Chasse/Portillon/Lien as dots, resonance, domain merits
- Haven: location, merits & flaws
- Social Ledger: advantages/flaws, boons/debts
- Ideology: chronicle tenets, coterie goals
- Members list with clan
- Attachment gallery (images + document links)

### 4. Update Existing Files

| File | Change |
|------|--------|
| `src/hooks/useCoteries.tsx` | Add all new fields to `Coterie` interface |
| `src/components/ui/file-upload.tsx` | Add `'coterie'` to `entityType` union |
| `src/components/dialogs/CreateCoterieDialog.tsx` | Add all V5 fields, dot selectors, file upload |
| `src/components/dialogs/ManageCoterieDialog.tsx` | Add all V5 fields, dot selectors, file upload, attachment gallery |
| `src/pages/Characters.tsx` | Add "Characters / Coteries" tab toggle at top; Coteries tab renders coterie cards + create button |
| `src/hooks/useGlobalSearch.tsx` | Change coterie route from `/coteries` to `/characters` |
| `src/components/mentions/MentionText.tsx` | Change coterie route from `/coteries` to `/characters` |

### 5. Cleanup

Delete `src/pages/Coteries.tsx` (standalone page, no route references it).

