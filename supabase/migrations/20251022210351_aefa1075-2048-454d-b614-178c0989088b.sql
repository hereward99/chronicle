-- Make generation column nullable since humans don't have generations
ALTER TABLE public.characters 
ALTER COLUMN generation DROP NOT NULL;

-- Clear generation data for all human characters
UPDATE public.characters 
SET generation = NULL 
WHERE clan = 'Human';