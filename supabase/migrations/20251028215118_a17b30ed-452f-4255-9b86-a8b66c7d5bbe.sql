-- Add Vampire: The Masquerade 5th Edition character sheet fields to characters table

-- Physical Attributes
ALTER TABLE public.characters ADD COLUMN strength integer DEFAULT 1 CHECK (strength >= 0 AND strength <= 5);
ALTER TABLE public.characters ADD COLUMN dexterity integer DEFAULT 1 CHECK (dexterity >= 0 AND dexterity <= 5);
ALTER TABLE public.characters ADD COLUMN stamina integer DEFAULT 1 CHECK (stamina >= 0 AND stamina <= 5);

-- Social Attributes
ALTER TABLE public.characters ADD COLUMN charisma integer DEFAULT 1 CHECK (charisma >= 0 AND charisma <= 5);
ALTER TABLE public.characters ADD COLUMN manipulation integer DEFAULT 1 CHECK (manipulation >= 0 AND manipulation <= 5);
ALTER TABLE public.characters ADD COLUMN composure integer DEFAULT 1 CHECK (composure >= 0 AND composure <= 5);

-- Mental Attributes
ALTER TABLE public.characters ADD COLUMN intelligence integer DEFAULT 1 CHECK (intelligence >= 0 AND intelligence <= 5);
ALTER TABLE public.characters ADD COLUMN wits integer DEFAULT 1 CHECK (wits >= 0 AND wits <= 5);
ALTER TABLE public.characters ADD COLUMN resolve integer DEFAULT 1 CHECK (resolve >= 0 AND resolve <= 5);

-- Skills (stored as JSONB for flexibility with specialties)
-- Format: {"athletics": {"rating": 3, "specialty": "Parkour"}, "academics": {"rating": 2}}
ALTER TABLE public.characters ADD COLUMN skills jsonb DEFAULT '{}'::jsonb;

-- Disciplines & Powers
-- Format: [{"name": "Auspex", "level": 2}, {"name": "Dominate", "level": 1}]
ALTER TABLE public.characters ADD COLUMN disciplines jsonb DEFAULT '[]'::jsonb;

-- Format: [{"name": "Sense the Unseen", "discipline": "Auspex", "level": 1, "cost": "Free"}]
ALTER TABLE public.characters ADD COLUMN powers jsonb DEFAULT '[]'::jsonb;

-- Character Creation Choices
ALTER TABLE public.characters ADD COLUMN predator_type text;
ALTER TABLE public.characters ADD COLUMN chronicle_tenets text[]; -- Coterie/Chronicle specific tenets

-- Advantages & Flaws
-- Format: [{"name": "Allies", "type": "background", "rating": 3, "description": "..."}]
ALTER TABLE public.characters ADD COLUMN advantages jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.characters ADD COLUMN flaws jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.characters ADD COLUMN loresheets jsonb DEFAULT '[]'::jsonb;

-- Beliefs System
ALTER TABLE public.characters ADD COLUMN convictions text[];
ALTER TABLE public.characters ADD COLUMN touchstones jsonb DEFAULT '[]'::jsonb; -- Format: [{"name": "Sarah", "conviction": "...", "description": "..."}]
ALTER TABLE public.characters ADD COLUMN ambition text;
ALTER TABLE public.characters ADD COLUMN desire text;

-- Game Trackers
ALTER TABLE public.characters ADD COLUMN health_max integer DEFAULT 3;
ALTER TABLE public.characters ADD COLUMN health_superficial integer DEFAULT 0;
ALTER TABLE public.characters ADD COLUMN health_aggravated integer DEFAULT 0;
ALTER TABLE public.characters ADD COLUMN willpower_max integer DEFAULT 3;
ALTER TABLE public.characters ADD COLUMN willpower_superficial integer DEFAULT 0;
ALTER TABLE public.characters ADD COLUMN willpower_aggravated integer DEFAULT 0;
ALTER TABLE public.characters ADD COLUMN humanity integer DEFAULT 7 CHECK (humanity >= 0 AND humanity <= 10);
ALTER TABLE public.characters ADD COLUMN hunger integer DEFAULT 1 CHECK (hunger >= 0 AND hunger <= 5);
ALTER TABLE public.characters ADD COLUMN blood_potency integer DEFAULT 0 CHECK (blood_potency >= 0 AND blood_potency <= 10);

-- Experience & Progression
ALTER TABLE public.characters ADD COLUMN experience_total integer DEFAULT 0;
ALTER TABLE public.characters ADD COLUMN experience_spent integer DEFAULT 0;

-- Additional Character Details
ALTER TABLE public.characters ADD COLUMN appearance text;
ALTER TABLE public.characters ADD COLUMN distinguishing_features text;
ALTER TABLE public.characters ADD COLUMN history text;
ALTER TABLE public.characters ADD COLUMN notes text;

-- Resonance tracking (for feeding)
ALTER TABLE public.characters ADD COLUMN resonance text; -- Sanguine, Melancholic, Choleric, Phlegmatic

COMMENT ON COLUMN public.characters.skills IS 'JSONB object storing skill ratings and specialties';
COMMENT ON COLUMN public.characters.disciplines IS 'JSONB array of discipline names and levels';
COMMENT ON COLUMN public.characters.powers IS 'JSONB array of vampiric powers';
COMMENT ON COLUMN public.characters.advantages IS 'JSONB array of merits and backgrounds';
COMMENT ON COLUMN public.characters.touchstones IS 'JSONB array of touchstone characters tied to convictions';