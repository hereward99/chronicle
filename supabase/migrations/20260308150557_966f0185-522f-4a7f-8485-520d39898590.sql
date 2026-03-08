
-- Step 1: Delete orphaned factions (chronicle no longer exists)
DELETE FROM public.factions
WHERE chronicle_id NOT IN (SELECT id FROM public.chronicles);

-- Step 2: Delete orphaned coteries (chronicle no longer exists)  
DELETE FROM public.coteries
WHERE chronicle_id NOT IN (SELECT id FROM public.chronicles);

-- Step 3: Fix the broken @mention in Lofoten Islands location
-- Update the mention from orphaned faction ID to the valid one
UPDATE public.locations
SET notes = REPLACE(
  notes,
  '(faction:a322b49a-88df-4b87-870a-5b880ded17e1)',
  '(faction:1db95e96-7bc4-45a3-9846-6fd772f7190a)'
)
WHERE notes LIKE '%a322b49a-88df-4b87-870a-5b880ded17e1%';

-- Step 4: Add cascade delete FK for factions -> chronicles
ALTER TABLE public.factions
  ADD CONSTRAINT factions_chronicle_id_fkey
  FOREIGN KEY (chronicle_id) REFERENCES public.chronicles(id) ON DELETE CASCADE;

-- Step 5: Add cascade delete FK for coteries -> chronicles
ALTER TABLE public.coteries
  ADD CONSTRAINT coteries_chronicle_id_fkey
  FOREIGN KEY (chronicle_id) REFERENCES public.chronicles(id) ON DELETE CASCADE;
