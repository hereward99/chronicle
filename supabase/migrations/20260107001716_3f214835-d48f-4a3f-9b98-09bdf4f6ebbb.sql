-- Add dice_pools column to characters table for Storyteller Characters
-- This stores dice pool data in one of 3 formats:
-- 1. Simple: { type: "simple", difficulty: number }
-- 2. General: { type: "general", primary: number, secondary: number }
-- 3. Standard: { type: "standard", physical: number, social: number, mental: number, exceptional: [{ name: string, pool: number }] }

ALTER TABLE public.characters 
ADD COLUMN dice_pools jsonb DEFAULT NULL;

-- Add use_dice_pools boolean to quickly check if character uses dice pools
ALTER TABLE public.characters 
ADD COLUMN use_dice_pools boolean DEFAULT false;

-- Add skip_attributes boolean for simple SPCs that don't need attributes
ALTER TABLE public.characters 
ADD COLUMN skip_attributes boolean DEFAULT false;

COMMENT ON COLUMN public.characters.dice_pools IS 'Dice pool configuration for Storyteller Characters. Supports simple (difficulty), general (primary/secondary), and standard (physical/social/mental + exceptional) formats.';
COMMENT ON COLUMN public.characters.use_dice_pools IS 'When true, character uses dice pools instead of skills.';
COMMENT ON COLUMN public.characters.skip_attributes IS 'When true, attributes are not displayed (for simple antagonists).';